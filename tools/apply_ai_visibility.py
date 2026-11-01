#!/usr/bin/env python3
"""
hubenkendo.cn — AI / 搜索引擎可发现性补丁。

站点是 vinext 的静态构建产物（仓库里只有 site/，没有源码），所以这里直接对
构建产物做结构化改写，并保持 HTML 与 RSC 载荷同步（RSC 决定客户端导航时
<head> 里还剩什么，两边不一致会导致 hydration 失配）。

做五件事：
  1. canonical 统一为带尾斜杠的最终 URL（原来指向 301 跳转目标）
  2. 每个页面加 rel=alternate：llms.txt（纯文本）与 feed.xml（RSS）
  3. 首页内嵌 llms.txt 全文（llmstxt.org 提案手法）
  4. 重建 robots.txt / llms.txt / llms-full.txt / feed.xml / sitemap.xml
  5. 自动发现日记文章 —— 新增日记后跑一次即可，无需改脚本

用法：
    python3 tools/apply_ai_visibility.py             # 只改仓库 site/
    python3 tools/apply_ai_visibility.py --deploy    # 改完并发布到 webroot
    python3 tools/apply_ai_visibility.py --check     # 只校验，不写入

幂等：重复运行不会重复注入。
"""
import argparse
import hashlib
import html as html_mod
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SITE = REPO / 'site'
BASE = 'https://hubenkendo.cn'
WEBROOT = Path('/var/www/hubenkendo')

RSS_TITLE = '剑道虎贲馆 · 剑道日记'

# 静态页（顺序 = 导航顺序）
STATIC_PAGES = [
    ('index',    'index.html',    'index.rsc',    '/',        '2026-10-25', 'weekly',  '1.0'),
    ('dojo',     'dojo/index.html', 'dojo.rsc',    '/dojo',    '2026-08-10', 'monthly', '0.8'),
    ('classes',  'classes/index.html', 'classes.rsc', '/classes', '2026-08-10', 'monthly', '0.9'),
    ('faq',      'faq/index.html', 'faq.rsc',     '/faq',     '2026-08-10', 'monthly', '0.8'),
    ('contact',  'contact/index.html', 'contact.rsc', '/contact', '2026-08-10', 'monthly', '0.9'),
    ('diary',    'diary/index.html', 'diary.rsc',  '/diary',   '2026-10-25', 'weekly',  '0.8'),
]

# 日记英文标题覆盖表（可选；没有的日记只是少一行英文说明，不影响运行）
DIARY_EN = {
    'agent-kendo-diary':
        'Why I went kendo practice after running five coding-agent sessions at once.',
    'uncertainty-tolerance':
        'How to keep acting while an important reply is still pending.',
    'expression-cheap-experience-no-shortcut':
        'Expression gets cheap; experience still has no shortcut.',
    'ai-human-worth-kendo':
        'If AI can do my job better than I can, what would I still want to do?',
}

SITE_EN = {
    '/': 'Huben Kendo Dojo — kendo club in Changning, Shanghai. Adults welcome, '
         'zero prior experience required. Fixed training every Saturday and '
         'Sunday 10:30–12:30.',
    '/dojo': 'About the dojo: location, training culture, and the practice of '
             'kendo at Huben Kendo in Shanghai Changning.',
    '/classes': 'Training schedule, how to join, and how to arrange a first '
                'visit to Huben Kendo in Shanghai.',
    '/faq': 'Frequently asked questions about joining a kendo club in Shanghai '
            'as an adult with no prior experience.',
    '/contact': 'Contact the dojo lead (Yao Xu) to arrange a visit to Huben '
                'Kendo, Shanghai Changning.',
    '/diary': 'Essays on kendo, practice, and working alongside AI, written by '
              'a practitioner in Shanghai.',
}

LINK_ALT_LLMS = '<link rel="alternate" type="text/plain" href="/llms.txt"/>'
LINK_ALT_RSS = ('<link rel="alternate" type="application/rss+xml" '
                 'title="' + RSS_TITLE + '" href="/feed.xml"/>')

AI_BOTS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot',
    'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User',
    'Bytespider', 'CCBot', 'Google-Extended', 'Applebot-Extended',
    'meta-externalagent', 'Amazonbot', 'MistralAI', 'DuckDuckBot',
    'cohere-ai', 'DeepSeekBot', 'QwantBot', 'YouBot',
]


# ---------------------------------------------------------------- helpers
def read(p):
    return p.read_text(encoding='utf-8')


def write(p, s):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding='utf-8')


def canonical_target(path):
    return BASE + (path if path.endswith('/') else path + '/')


def visible_text(html_text):
    body = html_text.split('</head>', 1)[-1]
    body = re.sub(r'<script.*?</script>', ' ', body, flags=re.S)
    body = re.sub(r'<style.*?</style>', ' ', body, flags=re.S)
    body = re.sub(r'<[^>]+>', '\n', body)
    body = html_mod.unescape(body)
    out, seen_blank = [], False
    for ln in (l.strip() for l in body.split('\n')):
        if not ln:
            if not seen_blank:
                out.append('')
                seen_blank = True
            continue
        seen_blank = False
        out.append(ln)
    return '\n'.join(out).strip()


def max_link_index(rsc_text):
    idx = [int(m) for m in re.findall(r'\["\$","link","(\d+)"', rsc_text)]
    return max(idx) if idx else -1


# ---------------------------------------------------------------- discovery
def discover_diaries():
    """扫描 site/diary/*/index.html，自动发现日记文章。

    标题与日期取自页面自身的 JSON-LD（datePublished / headline），是权威来源。
    """
    out = []
    diary_root = SITE / 'diary'
    if not diary_root.is_dir():
        return out
    for d in sorted(diary_root.iterdir()):
        # diary/ 下既有子目录（文章），也有 index.html 和 *.rsc（列表页）
        if not d.is_dir():
            continue
        html_rel = f'diary/{d.name}/index.html'
        rsc_rel = f'diary/{d.name}.rsc'
        if not (SITE / html_rel).is_file():
            print(f'  ! 跳过 {d.name}（缺 {html_rel}）', file=sys.stderr)
            continue
        if not (SITE / rsc_rel).is_file():
            # rsc 是同级的兄弟文件（vinext 构建产物）。缺了只影响 head 标签
            # 注入，这篇文章仍应进入 feed / sitemap / llms。
            print(f'  ~ {d.name} 缺 {rsc_rel}，跳过 head 标签注入（仍收录）',
                  file=sys.stderr)
        h = read(SITE / html_rel)

        date = ''
        m = re.search(r'"datePublished"\s*:\s*"(\d{4}-\d{2}-\d{2})"', h)
        if m:
            date = m.group(1)
        if not date:
            m = re.search(r'property="article:published_time"\s+content="([^"]+)"', h)
            date = m.group(1) if m else ''

        title = ''
        m = re.search(r'"@type"\s*:\s*"BlogPosting"\s*,\s*"headline"\s*:\s*"([^"]+)"', h)
        if m:
            title = m.group(1)
        if not title:
            m = re.search(r'<title>([^<]*)</title>', h)
            if m:
                title = html_mod.unescape(m.group(1)).split('｜')[0].strip()

        desc = ''
        m = re.search(r'"@type"\s*:\s*"BlogPosting"\s*,\s*"headline"\s*:\s*"[^"]*"\s*,'
                      r'\s*"description"\s*:\s*"([^"]*)"', h)
        if m:
            desc = m.group(1)

        modified = ''
        m = re.search(r'"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"', h)
        if m:
            modified = m.group(1)

        out.append({
            'slug': d.name,
            'html': html_rel,
            'rsc': rsc_rel,
            'path': f'/diary/{d.name}',
            'date': date,
            'modified': modified,
            'title': title,
            'desc': desc,
        })
    return out


def all_pages(diaries):
    """静态页 + 自动发现的日记页。"""
    pages = []
    for name, html_rel, rsc_rel, path, lastmod, freq, prio in STATIC_PAGES:
        pages.append({'name': name, 'html': html_rel, 'rsc': rsc_rel,
                      'path': path, 'lastmod': lastmod, 'freq': freq,
                      'prio': prio})
    for d in diaries:
        pages.append({'name': f'diary-{d["slug"]}', 'html': d['html'],
                      'rsc': d['rsc'], 'path': d['path'],
                      'lastmod': d['date'] or '2026-08-10',
                      'freq': 'monthly', 'prio': '0.7'})
    return pages


# ---------------------------------------------------------------- patching
def patch_html(path, page_path, llms_body, add_inline):
    src = read(path)
    orig = src

    m = re.search(r'<link rel="canonical" href="([^"]*)"\s*/>', src)
    if m:
        src = src.replace(
            m.group(0),
            f'<link rel="canonical" href="{canonical_target(page_path)}"/>')

    if 'rel="alternate"' not in src:
        m = re.search(r'<link rel="canonical" href="[^"]*"\s*/>', src)
        if m:
            src = src.replace(m.group(0), m.group(0) + LINK_ALT_LLMS + LINK_ALT_RSS)

    if add_inline and 'id="llms"' not in src:
        # <script type="text/plain"> 是原始文本区，不解码 HTML 实体，
        # 所以不能做实体转义；只需防止 </script> 提前闭合。
        payload = llms_body.replace('</script', '<\\/script')
        block = f'<script type="text/plain" id="llms">{payload}</script>'
        # 插在 layout 级 ld+json 之后（与 RSC 中 body 子元素顺序一致）
        blocks = list(re.finditer(
            r'<script type="application/ld\+json"[^>]*>.*?</script>', src, re.S))
        if blocks:
            pos = blocks[0].end()
            src = src[:pos] + block + src[pos:]
        else:
            src = src.replace('</body>', block + '</body>')

    if src != orig:
        write(path, src)
        return True
    return False


def patch_rsc(path, page_path, llms_body, add_inline):
    src = read(path)
    orig = src

    def _canon(m):
        return m.group(0).replace(m.group(2), canonical_target(page_path))
    src = re.sub(
        r'\["\$","link","(\d+)",\{"rel":"canonical","href":"([^"]*)"\}\]',
        _canon, src)

    if '"rel":"alternate"' not in src:
        m = re.search(
            r'\["\$","link","(\d+)",\{"rel":"canonical","href":"[^"]*"\}\]', src)
        if m:
            n = max_link_index(src) + 1
            add = (f',["$","link","{n}",{{"rel":"alternate","type":"text/plain",'
                   f'"href":"/llms.txt"}}]'
                   f',["$","link","{n+1}",{{"rel":"alternate",'
                   f'"type":"application/rss+xml","title":"{RSS_TITLE}",'
                   f'"href":"/feed.xml"}}]')
            src = src[:m.end()] + add + src[m.end():]

    if add_inline and '"id":"llms"' not in src:
        payload = json.dumps(llms_body, ensure_ascii=False)[1:-1]
        block = (f',["$","script",null,{{"type":"text/plain","id":"llms",'
                 f'"dangerouslySetInnerHTML":{{"__html":"{payload}"}}}}]')
        m = re.search(
            r'\["\$","script",null,\{"type":"application/ld\+json",'
            r'"dangerouslySetInnerHTML":\{"__html":"(?:[^"\\]|\\.)*"\}\}\]', src)
        if m:
            src = src[:m.end()] + block + src[m.end():]
        else:
            print(f'  ! {path}: 找不到 body script 锚点，内嵌 llms 跳过',
                  file=sys.stderr)

    if src != orig:
        write(path, src)
        return True
    return False


# ---------------------------------------------------------------- generators
def gen_robots():
    lines = [
        '# 剑道虎贲馆 hubenkendo.cn',
        '# 本站面向 AI 检索与人类访问同等开放。',
        '# 机器可读入口：',
        '#   /llms.txt        站点导览（Markdown）',
        '#   /llms-full.txt   全站单文件全文（Markdown）',
        '#   /feed.xml        日记更新（RSS 2.0）',
        '#   /sitemap.xml     页面清单',
        '',
        'User-agent: *',
        'Allow: /',
        '',
    ]
    for bot in AI_BOTS:
        lines += [f'User-agent: {bot}', 'Allow: /', '']
    for bot in ('Googlebot', 'Bingbot', 'Baiduspider',
                'Sogou web spider', '360Spider'):
        lines += [f'User-agent: {bot}', 'Allow: /', '']
    lines += ['Sitemap: https://hubenkendo.cn/sitemap.xml', '']
    return '\n'.join(lines)


def gen_llms_txt(diaries):
    out = [
        '# 剑道虎贲馆',
        '',
        '> 剑道虎贲馆位于上海长宁，面向成年人招生，接受零基础学员。',
        '> 固定训练：周六、周日 10:30–12:30。',
        '',
        'Machine-readable guides:',
        '',
        '- 全文版 (full text, single file): https://hubenkendo.cn/llms-full.txt',
        '- 日记订阅 (RSS): https://hubenkendo.cn/feed.xml',
        '',
        '## Huben Kendo Dojo (English)',
        '',
        'Huben Kendo Dojo is a kendo club in Changning, Shanghai. It trains '
        'adults and accepts complete beginners with no prior kendo '
        'experience. Training is fixed every Saturday and Sunday, 10:30–12:30, '
        'all year round. Visitors may arrange to watch a session by contacting '
        'the dojo lead, Yao Xu (5th dan).',
        '',
        'The site also publishes essays on kendo practice and on working '
        "alongside AI, written from a practitioner's point of view.",
        '',
        '## 站点信息',
        '',
        '- 名称：剑道虎贲馆',
        '- 地址：长宁路890号玫瑰坊东区B2GH5舞蹈工作室（上海市长宁区）',
        '- 训练时间：周六、周日 10:30–12:30（全年固定）',
        '- 招生对象：成年人，接受零基础学员',
        '- 参访旁听：可联系姚馆长预约',
        '- 联系人：姚旭（剑道五段）',
        '- 电话：13917242246',
        '- 微信：yaoxu123',
        '',
        '## 官网页面',
        '',
        '- 首页：https://hubenkendo.cn/',
    ]
    for path, en in SITE_EN.items():
        label = en.split(' —')[0].split('.')[0]
        out.append(f'- {label}（{path}）：https://hubenkendo.cn{path}')
    out += ['', '## 剑道日记', '', '按发布时间倒序。每篇提供网页原文与 Markdown 纯文本版。', '']
    for d in sorted(diaries, key=lambda x: x['date'], reverse=True):
        out.append(f'- {d["title"]}：https://hubenkendo.cn{d["path"]}/（{d["date"]}）')
        out.append(f'  - Markdown：https://hubenkendo.cn/llms/diary/{d["slug"]}.md')
        if d['slug'] in DIARY_EN:
            out.append(f'  - English: {DIARY_EN[d["slug"]]}')
    out += [
        '', '## 订阅', '',
        '- RSS 2.0：https://hubenkendo.cn/feed.xml',
        '- 全站全文：https://hubenkendo.cn/llms-full.txt',
        '', '## 说明', '',
        '以上内容来自剑道虎贲馆公开的道馆信息与剑道日记。费用、儿童课程、装备和'
        '未核验履历不在当前版本说明中。',
        '',
    ]
    return '\n'.join(out)


def patch_diary_md(diaries):
    """给 llms/diary/*.md 补元数据头（发布日期 / 英文标题 / 原文链接）。

    正文保持原样，只在 H1 之后插入一段元数据。
    """
    changed = []
    for d in diaries:
        md = SITE / 'llms' / 'diary' / f'{d["slug"]}.md'
        if not md.is_file():
            print(f'  ! 缺 {md.relative_to(SITE)}', file=sys.stderr)
            continue
        src = md.read_text(encoding='utf-8')
        if '> 发布日期：' in src:
            continue
        lines = src.split('\n')
        if not lines or not lines[0].startswith('# '):
            print(f'  ! {md.name}: 首行不是 H1，跳过', file=sys.stderr)
            continue
        mod = d['modified'] or d['date']
        meta = [
            '',
            f'> 发布日期：{d["date"]}（最后更新：{mod}）',
        ]
        if d['slug'] in DIARY_EN:
            meta.append(f'> 英文标题：{DIARY_EN[d["slug"]]}')
        meta += [
            f'> 原文：{BASE}{d["path"]}/',
            f'> Markdown 版：{BASE}/llms/diary/{d["slug"]}.md',
        ]
        out = '\n'.join(lines[:1] + meta + lines[1:])
        write(md, out)
        changed.append(str(md.relative_to(SITE)))
    return changed


def gen_llms_full(pages):
    out = [
        '# 剑道虎贲馆 — 全站全文',
        '',
        '# Huben Kendo Dojo — Full Text',
        '',
        '本文件包含站点全部页面的完整正文，便于一次性取用。',
        'This file contains the full text of every page on the site.',
        '',
        '---',
        '',
    ]
    for p in pages:
        m = re.search(r'<title>([^<]*)</title>', read(SITE / p['html']))
        title = html_mod.unescape(m.group(1)).split('｜')[0].strip() \
            if m else p['path']
        path = p['path'] if p['path'].endswith('/') else p['path'] + '/'
        out += [f'## {title}', '', f'URL: {BASE}{path}', '']
        out += [visible_text(read(SITE / p['html'])), '', '---', '']
    return '\n'.join(out)


def gen_feed(diaries):
    # lastBuildDate 取最新一篇日记的日期，而非当前时间 ——
    # 后者会让每次运行结果都不同（破坏幂等），且语义上不对：
    # feed 的构建时间应当反映最后一条 item 的时间。
    dated = [d['date'] for d in diaries if d['date']]
    now = (datetime.strptime(max(dated), '%Y-%m-%d').strftime(
        '%a, %d %b %Y 00:00:00 +0000') if dated
        else datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000'))
    items = []
    for d in sorted(diaries, key=lambda x: x['date'], reverse=True):
        desc = d['desc']
        md = SITE / 'llms' / 'diary' / f'{d["slug"]}.md'
        if md.is_file():
            for ln in md.read_text(encoding='utf-8').splitlines():
                ln = ln.strip()
                if ln and not ln.startswith('#'):
                    desc = desc or ln
                    break
        pub = datetime.strptime(d['date'], '%Y-%m-%d').strftime(
            '%a, %d %b %Y 00:00:00 +0000') if d['date'] else now
        items.append(f'''  <item>
    <title>{html_mod.escape(d["title"])}</title>
    <link>{BASE}{d["path"]}/</link>
    <guid isPermaLink="true">{BASE}{d["path"]}/</guid>
    <pubDate>{pub}</pubDate>
    <description>{html_mod.escape(desc)}</description>
  </item>''')
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{html_mod.escape(RSS_TITLE)}</title>
  <link>{BASE}/diary/</link>
  <description>剑道实践与 AI 时代的思考 —— 剑道虎贲馆（上海长宁）</description>
  <language>zh-CN</language>
  <lastBuildDate>{now}</lastBuildDate>
  <atom:link href="{BASE}/feed.xml" rel="self" type="application/rss+xml"/>
{chr(10).join(items)}
</channel>
</rss>
'''


def gen_sitemap(pages):
    entries = []
    for p in pages:
        path = p['path'] if p['path'].endswith('/') else p['path'] + '/'
        entries.append(
            f'  <url><loc>{BASE}{path}</loc>'
            f'<lastmod>{p["lastmod"]}</lastmod><changefreq>{p["freq"]}</changefreq>'
            f'<priority>{p["prio"]}</priority></url>')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(entries) + '\n</urlset>\n')


# ---------------------------------------------------------------- deploy
def deploy(pages, diaries):
    """把改动同步到 webroot（根 + site 副本），逐文件校验 sha256。"""
    targets = []
    for p in pages:
        targets.append(SITE / p['html'])
        if (SITE / p['rsc']).exists():
            targets.append(SITE / p['rsc'])
    targets += [SITE / 'robots.txt', SITE / 'llms.txt', SITE / 'llms-full.txt',
                SITE / 'feed.xml', SITE / 'sitemap.xml']
    for d in diaries:
        md = SITE / 'llms' / 'diary' / f'{d["slug"]}.md'
        if md.is_file():
            targets.append(md)

    for src in targets:
        rel = src.relative_to(SITE)
        for dest_root in (WEBROOT, WEBROOT / 'site'):
            dst = dest_root / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(src, dst)
            subprocess.run(['chmod', '666', str(dst)], check=False)

    bad = []
    for src in targets:
        rel = src.relative_to(SITE)
        h = hashlib.sha256(src.read_bytes()).hexdigest()
        for dest_root in (WEBROOT, WEBROOT / 'site'):
            dst = dest_root / rel
            if not dst.is_file() or \
                    hashlib.sha256(dst.read_bytes()).hexdigest() != h:
                bad.append(str(dst))
    if bad:
        print('校验失败:', bad, file=sys.stderr)
        return 1
    print(f'已发布 {len(targets)} 个文件到 webroot（sha256 全部一致）')
    return 0


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='只校验不写入')
    ap.add_argument('--deploy', action='store_true', help='发布到 webroot')
    args = ap.parse_args()

    if not SITE.is_dir():
        print(f'找不到 {SITE}', file=sys.stderr)
        return 1

    diaries = discover_diaries()
    pages = all_pages(diaries)
    print(f'发现 {len(diaries)} 篇日记：'
          + ', '.join(f'{d["slug"]}({d["date"]})' for d in diaries))

    llms_body = gen_llms_txt(diaries)

    if args.check:
        print('check 模式：未写入')
        return 0

    changed = []
    for p in pages:
        add_inline = (p['name'] == 'index')
        h = SITE / p['html']
        r = SITE / p['rsc']
        if not h.exists():
            print(f'  ! 缺文件: {h}', file=sys.stderr)
            continue
        if patch_html(h, p['path'], llms_body, add_inline):
            changed.append(p['html'])
        if r.exists() and patch_rsc(r, p['path'], llms_body, add_inline):
            changed.append(p['rsc'])

    write(SITE / 'robots.txt', gen_robots())
    write(SITE / 'llms.txt', llms_body)
    write(SITE / 'llms-full.txt', gen_llms_full(pages))
    write(SITE / 'feed.xml', gen_feed(diaries))
    write(SITE / 'sitemap.xml', gen_sitemap(pages))
    changed += ['robots.txt', 'llms.txt', 'llms-full.txt', 'feed.xml',
                'sitemap.xml']
    changed += patch_diary_md(diaries)

    print(f'完成，改动 {len(changed)} 个文件：')
    for c in sorted(set(changed)):
        print(f'  - {c}')

    if args.deploy:
        return deploy(pages, diaries)
    return 0


if __name__ == '__main__':
    sys.exit(main())
