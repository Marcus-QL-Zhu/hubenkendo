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

    expect(result.zh).toBe(['角色设定：', '发型：中分', '服饰：白衬衫，百褶裙'].join('\n'));
    expect(result.en).toBe(['Character:', 'Hair: Middle Part', 'Outfit: Button-up Shirt, Pleated Skirt'].join('\n'));
  });

  it('skips empty sections', () => {
    const result = buildPrompts(catalog, { hair: [] });

    expect(result.zh).toBe('角色设定：');
    expect(result.en).toBe('Character:');
  });
});
