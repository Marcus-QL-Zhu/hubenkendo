import { getSelectedItems } from './selection.js';

const ZH_PHOTO_PREFIX = '充满女友感的真实照片写真，真实人物摄影风格，自然亲近，生活感，非二次元，非插画。';
const EN_PHOTO_PREFIX = 'A girlfriend-like realistic portrait photo, real-person photography style, natural and intimate, lifestyle feeling, not anime, not illustration.';

export function buildPrompts(catalog, selection) {
  const zhLines = [ZH_PHOTO_PREFIX, '角色设定：'];
  const enLines = [EN_PHOTO_PREFIX, 'Character:'];

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
