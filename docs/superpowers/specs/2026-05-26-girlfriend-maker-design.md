# Girlfriend Maker Design

## Goal

Build `女友Maker`, a mobile-first static web app for assembling AI image prompts from Draco正在VibeCoding's reference image article. Users browse cut-out reference images, pick visual traits step by step, and copy a structured Chinese prompt and a structured English prompt.

The first release is for private or small-group use. It fully reuses the locally saved article assets. Public release is deferred until the user obtains permission from the original author. The app should still credit the source on the cover page and result page.

## Source Material

Inputs:

- `C:\Users\wande\Downloads\text_to_pic.html`
- `C:\Users\wande\Downloads\text_to_pic_files`

Observed structure:

- The article contains grouped prompt terms in Chinese / English pairs.
- Most image groups contain four terms and one visual reference image.
- The image is normally a 2x2 collage. Common dimensions include `1024x1024`, `1024x1536`, and `1080x720`.
- Images are WebP files saved without file extensions.

Preprocessing rules:

- Parse article headings into major sections and subcategories.
- Parse each prompt term into `{ zh, en }`.
- Each usable image group must resolve to exactly four terms.
- Each image group is cut into four tiles by splitting current width and height into a 2x2 grid.
- Tile binding order is reading order: top-left, top-right, bottom-left, bottom-right.
- If a group cannot resolve to exactly four terms, or an image cannot be read or split, the build fails loudly. The implementation should fix parser logic or explicitly handle that source case before continuing.

## Product Shape

Use a React/Vite static site deployable to GitHub Pages. The final build is ordinary static files: HTML, CSS, JavaScript, JSON data, and image assets.

The app does not require a backend, database, login, or server-side rendering. Selection state lives in the browser and can be persisted in local storage.

## User Flow

1. Cover page
2. Hair
3. Hair accessories
4. Outfit
5. Expression
6. Pose
7. Camera language
8. Lighting / atmosphere
9. Prompt result

The cover page is not counted in progress. The guided flow shows progress from `1 / 8` through `8 / 8`.

Users can follow the main flow with Previous / Next buttons, or jump directly to another step from a step navigation control.

## Cover Page

The first screen should feel cute, warm, and lightweight without looking childish.

Required content:

- Title: `女友Maker`
- Short description: `点选参考图，快速拼出 AI 女友角色 Prompt`
- Primary button: `立即开始`
- Optional button: `继续上次选择`, shown only when saved local state exists
- Source credit near the bottom:
  - `素材整理自 Draco正在VibeCoding`
  - Link: `https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA`

Do not show an authorization statement in the first release.

## Main Selection UI

Each step page contains:

- Header with step title and current progress.
- Progress bar with remaining-step hint.
- Horizontal subcategory tabs.
- Image tile grid using the pre-cut single-reference images.
- Current selection summary.
- Bottom actions: Previous, Next, View Prompt.

The grid is optimized for phones:

- Two columns by default.
- Lazy-load images.
- Keep cards compact and tappable.
- Selected cards show a clear visual selected state.
- Each card displays Chinese and English labels.

## Selection Rules

Selection rules are configured per major section:

- Hair: single-select
- Hair accessories: multi-select
- Outfit: multi-select
- Expression: single-select
- Pose: single-select
- Camera language: single-select
- Lighting / atmosphere: multi-select

These rules should live in configuration so they can be changed without rewriting component logic.

## Prompt Output

The result page generates two independent structured prompts.

Chinese prompt example:

```text
角色设定：
发型：中分
发饰：蝴蝶结发带
服饰：白衬衫，百褶裙
表情：害羞微笑
姿态：自然站姿
镜头：半身像
光影：柔和自然光
```

English prompt example:

```text
Character:
Hair: Middle Part
Hair Accessories: Bow Headband
Outfit: Button-up Shirt, Pleated Skirt
Expression: Shy Smile
Pose: Natural Standing Pose
Camera: Half-body Shot
Lighting: Soft Natural Light
```

Result page controls:

- Copy Chinese prompt.
- Copy English prompt.
- Open GPT image 2 page: `https://ai.mikuapi.org/?invite_code=QNCW6`
- Return to edit selections.

The result page also credits:

- Original author: `Draco正在VibeCoding`
- Original article: `https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA`

## Data Model

Generated `catalog.json` should contain sections with stable ids:

```json
{
  "sections": [
    {
      "id": "hair",
      "titleZh": "发型",
      "titleEn": "Hair",
      "selectionMode": "single",
      "subcategories": [
        {
          "id": "hair-parting-outline",
          "titleZh": "分缝 / 轮廓",
          "titleEn": "Parting / Outline",
          "items": [
            {
              "id": "hair-middle-part",
              "zh": "中分",
              "en": "Middle Part",
              "image": "assets/tiles/hair-middle-part.webp",
              "sourceImage": "assets/source/640(1).webp",
              "sourceArticle": "https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA"
            }
          ]
        }
      ]
    }
  ]
}
```

Ids should be deterministic and collision-safe.

## Architecture

Project layout:

```text
girlfriend-maker/
  scripts/
    build-catalog.js
  src/
    components/
    data/
    pages/
    App.jsx
    main.jsx
  public/
    assets/
      tiles/
      source/
    catalog.json
  package.json
  vite.config.js
```

Preprocessing script responsibilities:

- Read the saved HTML and local resource folder.
- Extract the content hierarchy and image groups.
- Validate group shape.
- Split 2x2 collages into tile images.
- Write optimized WebP tile assets.
- Write `public/catalog.json`.

Frontend responsibilities:

- Load `catalog.json`.
- Render cover, guided selection pages, and result page.
- Manage selection state.
- Persist and restore selection state from local storage.
- Generate Chinese and English prompt strings.
- Copy prompts through the Clipboard API, with a fallback message if copying fails.

## Error Handling

Build-time errors:

- Missing source HTML or files folder.
- Missing local image file.
- Image cannot be opened.
- Parsed term count is not exactly four for a source image group.
- Tile output cannot be written.

Runtime handling:

- If catalog loading fails, show a simple error screen.
- If clipboard copy fails, select/show the prompt text and tell the user to copy manually.
- If local storage is unavailable, the app still works without persistence.

## Deployment

Deploy as a GitHub Pages static site. Vite should be configured with the correct `base` path for a project page, likely `/girlfriend-maker/`.

Expected final URL shape:

```text
https://<github-username>.github.io/girlfriend-maker/
```

## Verification

Before considering the implementation complete:

- Run the preprocessing script and confirm it produces catalog data and tile assets.
- Run the app locally and verify the cover page, guided flow, filtering tabs, selection rules, prompt output, and copy buttons.
- Build the static site successfully.
- Inspect the mobile layout in a browser-sized viewport.
- Verify that generated prompts include both Chinese and English selections correctly.
- Verify that source credits and external links are present.
