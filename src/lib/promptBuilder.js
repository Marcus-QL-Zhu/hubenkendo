import { getSelectedItems } from './selection.js';

export function buildPrompts(catalog, selection) {
  const zhLines = ['角色设定：'];
  const enLines = ['Character:'];

  for (const section of catalog.sections) {
    const items = getSelectedItems(section, selection[section.id] || []);
    if (items.length === 0) continue;

    zhLines.push(`${section.titleZh}：${items.map((item) => item.zh).join('，')}`);
    enLines.push(`${section.titleEn}: ${items.map((item) => item.en).join(', ')}`);
  }

  return {
    zh: zhLines.join('\n'),
    en: enLines.join('\n')
  };
}
