import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractArticleGroups } from './lib/extractArticle.mjs';
import { createUniqueSlug } from './lib/slug.mjs';
import { splitImageIntoTiles } from './lib/splitTiles.mjs';
import { SECTION_CONFIG, sectionForHeading } from '../src/data/sections.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultHtmlPath = 'C:\\Users\\wande\\Downloads\\text_to_pic.html';
const defaultBaseDir = 'C:\\Users\\wande\\Downloads';
const sourceArticle = 'https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA';

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    args.set(argv[index], argv[index + 1]);
  }
  return {
    htmlPath: args.get('--html') || defaultHtmlPath,
    baseDir: args.get('--base-dir') || defaultBaseDir
  };
}

function ensureFourTerms(group) {
  if (group.terms.length !== 4) {
    throw new Error(
      `Expected 4 terms for ${group.imagePath}, got ${group.terms.length}: ${group.terms
        .map((term) => `${term.zh}/${term.en}`)
        .join(', ')}`
    );
  }
}

function createEmptyCatalog() {
  return {
    sourceArticle,
    sections: SECTION_CONFIG.map((section) => ({
      id: section.id,
      titleZh: section.titleZh,
      titleEn: section.titleEn,
      selectionMode: section.selectionMode,
      subcategories: []
    }))
  };
}

function getOrCreateSubcategory(section, title, usedSubcategoryIds) {
  const normalizedTitle = title.replace(/\s+/g, '');
  let subcategory = section.subcategories.find((item) => item.sourceTitleKey === normalizedTitle);
  if (subcategory) return subcategory;

  subcategory = {
    id: createUniqueSlug(title, title, usedSubcategoryIds, `${section.id}-group`),
    titleZh: title,
    titleEn: title,
    sourceTitleKey: normalizedTitle,
    items: []
  };
  section.subcategories.push(subcategory);
  return subcategory;
}

async function main() {
  const { htmlPath, baseDir } = parseArgs(process.argv.slice(2));
  const html = await readFile(htmlPath, 'utf8');
  const groups = extractArticleGroups(html);
  const catalog = createEmptyCatalog();
  const sectionMap = new Map(catalog.sections.map((section) => [section.id, section]));
  const usedItemIds = new Set();
  const usedSubcategoryIds = new Set();
  const tilesDir = path.join(rootDir, 'public', 'assets', 'tiles');
  const sourceDir = path.join(rootDir, 'public', 'assets', 'source');

  await rm(path.join(rootDir, 'public'), { recursive: true, force: true });
  await mkdir(tilesDir, { recursive: true });
  await mkdir(sourceDir, { recursive: true });

  for (const group of groups) {
    const config = sectionForHeading(group.majorTitle);
    if (!config) continue;
    ensureFourTerms(group);

    const section = sectionMap.get(config.id);
    const subcategory = getOrCreateSubcategory(section, group.subcategoryTitle || section.titleZh, usedSubcategoryIds);
    const sourceImagePath = path.join(baseDir, group.imagePath.replace(/\//g, path.sep));
    const outputPaths = group.terms.map((term) => {
      const id = createUniqueSlug(term.zh, term.en, usedItemIds, 'item');
      return {
        id,
        zh: term.zh,
        en: term.en,
        absolutePath: path.join(tilesDir, `${id}.webp`),
        publicPath: `assets/tiles/${id}.webp`
      };
    });

    await splitImageIntoTiles(
      sourceImagePath,
      outputPaths.map((item) => item.absolutePath)
    );

    for (const item of outputPaths) {
      subcategory.items.push({
        id: item.id,
        zh: item.zh,
        en: item.en,
        image: item.publicPath,
        sourceImage: group.imagePath,
        sourceArticle
      });
    }
  }

  catalog.sections = catalog.sections.filter((section) =>
    section.subcategories.some((subcategory) => subcategory.items.length > 0)
  );

  await mkdir(path.join(rootDir, 'public'), { recursive: true });
  await writeJson(path.join(rootDir, 'public', 'catalog.json'), catalog);
  const totalItems = catalog.sections.flatMap((section) => section.subcategories.flatMap((subcategory) => subcategory.items)).length;
  console.log(`Generated ${totalItems} items across ${catalog.sections.length} sections.`);
}

async function writeJson(filePath, value) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
