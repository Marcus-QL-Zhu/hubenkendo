import { describe, expect, it } from 'vitest';
import { getSelectedItems, toggleSelection } from '../src/lib/selection.js';

const section = {
  id: 'hair',
  selectionMode: 'single',
  subcategories: [
    { items: [{ id: 'middle-part' }, { id: 'side-part' }] }
  ]
};

describe('toggleSelection', () => {
  it('replaces the current item for single-select sections', () => {
    const next = toggleSelection({ hair: ['middle-part'] }, section, 'side-part');

    expect(next).toEqual({ hair: ['side-part'] });
  });

  it('toggles items for multi-select sections', () => {
    const multi = { ...section, selectionMode: 'multi' };

    expect(toggleSelection({ hair: ['middle-part'] }, multi, 'side-part')).toEqual({
      hair: ['middle-part', 'side-part']
    });
    expect(toggleSelection({ hair: ['middle-part'] }, multi, 'middle-part')).toEqual({
      hair: []
    });
  });
});

describe('getSelectedItems', () => {
  it('returns catalog items in selected order', () => {
    const items = getSelectedItems(section, ['side-part', 'middle-part']);

    expect(items.map((item) => item.id)).toEqual(['side-part', 'middle-part']);
  });
});
