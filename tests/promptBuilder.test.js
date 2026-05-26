import { describe, expect, it } from 'vitest';
import { buildPrompts } from '../src/lib/promptBuilder.js';

const catalog = {
  sections: [
    {
      id: 'hair',
      titleZh: '发型',
      titleEn: 'Hair',
      subcategories: [
        { items: [{ id: 'middle-part', zh: '中分', en: 'Middle Part' }] }
      ]
    },
    {
      id: 'outfit',
      titleZh: '服饰',
      titleEn: 'Outfit',
      subcategories: [
        {
          items: [
            { id: 'button-up-shirt', zh: '白衬衫', en: 'Button-up Shirt' },
            { id: 'pleated-skirt', zh: '百褶裙', en: 'Pleated Skirt' }
          ]
        }
      ]
    }
  ]
};

describe('buildPrompts', () => {
  it('builds Chinese and English structured prompts from selected ids', () => {
    const result = buildPrompts(catalog, {
      hair: ['middle-part'],
      outfit: ['button-up-shirt', 'pleated-skirt']
    });

    expect(result.zh).toBe([
      '充满女友感的真实照片写真，真实人物摄影风格，自然亲近，生活感，非二次元，非插画。',
      '角色设定：',
      '发型：中分',
      '服饰：白衬衫，百褶裙'
    ].join('\n'));
    expect(result.en).toBe([
      'A girlfriend-like realistic portrait photo, real-person photography style, natural and intimate, lifestyle feeling, not anime, not illustration.',
      'Character:',
      'Hair: Middle Part',
      'Outfit: Button-up Shirt, Pleated Skirt'
    ].join('\n'));
  });

  it('skips empty sections', () => {
    const result = buildPrompts(catalog, { hair: [] });

    expect(result.zh).toContain('充满女友感的真实照片写真');
    expect(result.en).toContain('girlfriend-like realistic portrait photo');
  });
});
