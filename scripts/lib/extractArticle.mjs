const LOCAL_IMAGE_RE = /(?:\.\/)?text_to_pic_files\/[^"'\s<>]+/i;
const TERM_TRANSLATIONS = new Map([
  ['长波波头', 'Long Bob'],
  ['狼尾剪', 'Wolf Cut'],
  ['鲻鱼头', 'Mullet'],
  ['姬发式', 'Hime Cut'],
  ['底削', 'Undercut'],
  ['齐切波波头', 'Blunt Bob'],
  ['法式波波头', 'French Bob'],
  ['意式波波头', 'Italian Bob'],
  ['精灵短发', 'Pixie Cut'],
  ['比克西短发', 'Bixie Cut'],
  ['超短裁剪', 'Ultra-short Crop'],
  ['寸头', 'Buzz Cut']
]);

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function normalizeText(value) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return normalizeText(
    String(value || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );
}

function parseTerm(raw) {
  const text = normalizeText(raw);
  if (!text.includes('/')) {
    const en = TERM_TRANSLATIONS.get(text);
    return en ? { zh: text, en } : null;
  }
  const [zh, ...enParts] = text.split('/');
  const en = enParts.join('/').trim();
  const zhText = zh.trim();
  if (!zhText || !en) return null;
  return { zh: zhText, en };
}

function extractTerms(preHtml) {
  const codeMatch = preHtml.match(/<code\b[^>]*>([\s\S]*?)<\/code>/i);
  const source = codeMatch ? codeMatch[1] : preHtml;
  const spanMatches = [...source.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>/gi)]
    .map((match) => stripTags(match[1]))
    .map(parseTerm)
    .filter(Boolean);

  if (spanMatches.length > 0) return spanMatches;

  return stripTags(source)
    .split(/\n| {2,}/)
    .map(parseTerm)
    .filter(Boolean);
}

function extractLocalImage(figureHtml) {
  const imgMatch = figureHtml.match(/<img\b[^>]*>/i);
  if (!imgMatch) return null;
  const srcMatch = imgMatch[0].match(/(?:^|\s)src="([^"]+)"/i);
  if (!srcMatch) return null;
  const decoded = decodeHtml(srcMatch[1]).replace(/^\.\//, '');
  return LOCAL_IMAGE_RE.test(decoded) ? decoded : null;
}

function headingText(tagHtml) {
  return stripTags(tagHtml);
}

export function extractArticleGroups(html) {
  const tokens = [...String(html).matchAll(/<(h[234])\b[\s\S]*?<\/\1>|<pre\b[\s\S]*?<\/pre>|<figure\b[\s\S]*?<\/figure>/gi)];
  let majorTitle = '';
  let categoryTitle = '';
  let subcategoryTitle = '';
  let pendingPre = null;
  const groups = [];

  for (const token of tokens) {
    const raw = token[0];
    const lower = raw.slice(0, 8).toLowerCase();

    if (lower.startsWith('<h2')) {
      const title = headingText(raw);
      if (title) majorTitle = title;
      categoryTitle = '';
      subcategoryTitle = '';
      pendingPre = null;
      continue;
    }

    if (lower.startsWith('<h3')) {
      const title = headingText(raw);
      if (title) {
        categoryTitle = title;
        subcategoryTitle = title;
      }
      pendingPre = null;
      continue;
    }

    if (lower.startsWith('<h4')) {
      const title = headingText(raw);
      if (title) subcategoryTitle = title;
      pendingPre = null;
      continue;
    }

    if (lower.startsWith('<pre')) {
      pendingPre = raw;
      continue;
    }

    if (lower.startsWith('<figure') && pendingPre) {
      const imagePath = extractLocalImage(raw);
      if (!imagePath) {
        pendingPre = null;
        continue;
      }

      groups.push({
        majorTitle,
        subcategoryTitle: subcategoryTitle || categoryTitle || majorTitle,
        imagePath,
        terms: extractTerms(pendingPre)
      });
      pendingPre = null;
    }
  }

  return groups;
}
