# Girlfriend Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React/Vite static site that turns Draco reference images into selectable prompt parts and generates Chinese and English structured prompts.

**Architecture:** A Node preprocessing script parses the saved WeChat HTML, splits each 2x2 source image into four tiles, and writes `public/catalog.json` plus image assets. The React app loads that catalog, manages local selection state, renders the cover/wizard/result flow, and builds copyable prompts entirely in the browser.

**Tech Stack:** Vite, React, JavaScript, Sharp for image processing, Vitest for parser/prompt unit tests, GitHub Pages-ready static build.

---

### Task 1: Scaffold Vite App And Project Hygiene

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `.gitignore`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`

- [ ] **Step 1: Create package manifest**

Create `package.json` with scripts for development, preprocessing, testing, and production build.

- [ ] **Step 2: Create Vite entry files**

Create `index.html`, `src/main.jsx`, `src/App.jsx`, and `src/styles.css` with a minimal renderable app.

- [ ] **Step 3: Configure GitHub Pages base**

Create `vite.config.js` using `base: '/girlfriend-maker/'`, React plugin, and Vitest jsdom environment.

- [ ] **Step 4: Add ignore rules**

Create `.gitignore` for `node_modules`, `dist`, generated image assets, temporary logs, and local brainstorming files.

- [ ] **Step 5: Install dependencies**

Run `npm install`.

- [ ] **Step 6: Verify scaffold**

Run `npm run build`.
Expected: Vite builds successfully.

- [ ] **Step 7: Commit scaffold**

Commit with `chore: scaffold vite app`.

### Task 2: Build Source Parser And Catalog Generator

**Files:**
- Create: `scripts/build-catalog.mjs`
- Create: `scripts/lib/extractArticle.mjs`
- Create: `scripts/lib/splitTiles.mjs`
- Create: `scripts/lib/slug.mjs`
- Create: `src/data/sections.js`
- Create: `tests/extractArticle.test.mjs`
- Create: `tests/slug.test.mjs`

- [ ] **Step 1: Add section configuration**

Create `src/data/sections.js` defining app steps, selection modes, and mapping source section headings to app section ids.

- [ ] **Step 2: Write slug tests**

Test deterministic ASCII ids and collision suffix behavior.

- [ ] **Step 3: Implement slug helper**

Implement stable ids from English text when available, falling back to pinyin-like sanitized Chinese text plus a numeric suffix for collisions.

- [ ] **Step 4: Write parser tests**

Use small HTML fixtures inside the test file to prove the parser extracts headings, subcategories, four terms, and local image paths.

- [ ] **Step 5: Implement parser**

Parse the saved HTML into source groups with major section, subcategory, image path, and four `{ zh, en }` terms.

- [ ] **Step 6: Implement tile splitter**

Use Sharp to open each source image and write four WebP tiles by splitting width and height at their midpoints.

- [ ] **Step 7: Implement catalog build script**

Read source paths from CLI args or defaults, run extraction, validate groups, split tiles, and write `public/catalog.json`.

- [ ] **Step 8: Run tests**

Run `npm test -- --run`.
Expected: parser and slug tests pass.

- [ ] **Step 9: Generate real catalog**

Run `npm run build:catalog`.
Expected: `public/catalog.json` and `public/assets/tiles/*.webp` are generated.

- [ ] **Step 10: Commit generator**

Commit with `feat: generate prompt catalog from saved article`.

### Task 3: Prompt Builder And Selection State

**Files:**
- Create: `src/lib/promptBuilder.js`
- Create: `src/lib/storage.js`
- Create: `src/lib/selection.js`
- Create: `tests/promptBuilder.test.js`
- Create: `tests/selection.test.js`

- [ ] **Step 1: Write prompt builder tests**

Test Chinese and English structured output with single and multi-select sections.

- [ ] **Step 2: Implement prompt builder**

Generate section labels and comma-separated selections from catalog data and selected ids.

- [ ] **Step 3: Write selection tests**

Test single-select replacement, multi-select toggle, and selected-item lookup.

- [ ] **Step 4: Implement selection helpers**

Add pure functions for toggling selections based on section mode.

- [ ] **Step 5: Implement storage helpers**

Add local storage load/save/clear functions that fail gracefully.

- [ ] **Step 6: Run tests**

Run `npm test -- --run`.
Expected: prompt and selection tests pass.

- [ ] **Step 7: Commit state logic**

Commit with `feat: add prompt and selection logic`.

### Task 4: Build Mobile UI Flow

**Files:**
- Create: `src/components/CoverPage.jsx`
- Create: `src/components/StepPage.jsx`
- Create: `src/components/ResultPage.jsx`
- Create: `src/components/ProgressBar.jsx`
- Create: `src/components/StepNav.jsx`
- Create: `src/components/TileGrid.jsx`
- Modify: `src/App.jsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Build app shell**

Load catalog data, manage current screen, selection state, and local persistence.

- [ ] **Step 2: Build cover page**

Render title, description, start button, optional continue button, and source credit link.

- [ ] **Step 3: Build guided step page**

Render step header, progress, subcategory tabs, selected summary, tile grid, and bottom navigation.

- [ ] **Step 4: Build tile grid**

Render lazy-loaded image cards with Chinese/English labels and selected state.

- [ ] **Step 5: Build result page**

Render Chinese and English prompts, copy buttons, edit button, and GPT image 2 link.

- [ ] **Step 6: Polish responsive styles**

Make the phone layout compact, readable, cute on the cover, and efficient in the tool flow.

- [ ] **Step 7: Build**

Run `npm run build`.
Expected: production build succeeds.

- [ ] **Step 8: Commit UI**

Commit with `feat: build mobile prompt maker ui`.

### Task 5: Verify Locally And Prepare GitHub Pages

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Modify: `package.json`

- [ ] **Step 1: Add README**

Document what the app is, how to build catalog, run locally, build, and deploy to GitHub Pages.

- [ ] **Step 2: Add Pages workflow**

Create GitHub Actions workflow to build and upload the static site when pushing to `main`.

- [ ] **Step 3: Verify full pipeline**

Run `npm run build:catalog`, `npm test -- --run`, and `npm run build`.
Expected: all pass.

- [ ] **Step 4: Start local preview**

Run `npm run dev -- --host 127.0.0.1`.
Expected: dev server prints a local URL.

- [ ] **Step 5: Inspect app in browser**

Open the local URL, verify cover page, step navigation, category filters, selection rules, prompt output, copy buttons, and links.

- [ ] **Step 6: Commit deployment docs**

Commit with `docs: add github pages deployment`.

## Self-Review

- Spec coverage: The plan covers preprocessing, four-tile splitting, full catalog generation, cover page, guided flow, selection modes, prompt output, credits, GPT image link, persistence, GitHub Pages deployment, tests, and local verification.
- Placeholder scan: The plan contains no TBD/TODO placeholders. Each task has concrete files, commands, and expected outcomes.
- Type consistency: Planned files share the same concepts: catalog sections, selection modes, selected ids, and prompt builder output.
