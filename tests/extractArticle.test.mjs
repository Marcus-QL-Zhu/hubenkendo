import { describe, expect, it } from 'vitest';
import { extractArticleGroups } from '../scripts/lib/extractArticle.mjs';

describe('extractArticleGroups', () => {
  it('extracts major section, subcategory, terms, and local image path', () => {
    const html = `
      <h2>一、发型</h2>
      <h4>分缝 / 轮廓</h4>
      <pre>
        <code>
          <span leaf="">中分 / Middle Part</span>
          <span leaf=""><br /></span>
          <span leaf="">侧分 / Side Part</span>
          <span leaf=""><br /></span>
          <span leaf="">深侧分 / Deep Side Part</span>
          <span leaf=""><br /></span>
          <span leaf="">闪电分线 / Zigzag Part</span>
        </code>
      </pre>
      <figure>
        <img src="./text_to_pic_files/640(1)" data-src="https://example.test/640" />
      </figure>
    `;

    const groups = extractArticleGroups(html);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual({
      majorTitle: '一、发型',
      subcategoryTitle: '分缝 / 轮廓',
      imagePath: 'text_to_pic_files/640(1)',
      terms: [
        { zh: '中分', en: 'Middle Part' },
        { zh: '侧分', en: 'Side Part' },
        { zh: '深侧分', en: 'Deep Side Part' },
        { zh: '闪电分线', en: 'Zigzag Part' }
      ]
    });
  });

  it('ignores pre blocks that are not followed by a local article image', () => {
    const html = `
      <h2>一、发型</h2>
      <h4>分缝 / 轮廓</h4>
      <pre><span leaf="">中分 / Middle Part</span></pre>
      <p>No figure here</p>
    `;

    expect(extractArticleGroups(html)).toEqual([]);
  });
});
