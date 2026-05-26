import { describe, expect, it } from 'vitest';
import { createUniqueSlug } from '../scripts/lib/slug.mjs';

describe('createUniqueSlug', () => {
  it('uses readable English text as the primary slug source', () => {
    const used = new Set();

    expect(createUniqueSlug('中分', 'Middle Part', used)).toBe('middle-part');
    expect(used.has('middle-part')).toBe(true);
  });

  it('adds a numeric suffix when a slug already exists', () => {
    const used = new Set(['middle-part']);

    expect(createUniqueSlug('中分', 'Middle Part', used)).toBe('middle-part-2');
    expect(used.has('middle-part-2')).toBe(true);
  });

  it('falls back to a stable item slug when text has no ASCII words', () => {
    const used = new Set();

    expect(createUniqueSlug('中分', '', used)).toBe('item');
    expect(createUniqueSlug('中分', '', used)).toBe('item-2');
  });
});
