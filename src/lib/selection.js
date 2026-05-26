export function allItems(section) {
  return section.subcategories.flatMap((subcategory) => subcategory.items);
}

export function toggleSelection(selection, section, itemId) {
  const current = selection[section.id] || [];

  if (section.selectionMode === 'single') {
    return {
      ...selection,
      [section.id]: current.includes(itemId) ? [] : [itemId]
    };
  }

  return {
    ...selection,
    [section.id]: current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId]
  };
}

export function getSelectedItems(section, selectedIds = []) {
  const itemMap = new Map(allItems(section).map((item) => [item.id, item]));
  return selectedIds.map((id) => itemMap.get(id)).filter(Boolean);
}

export function hasSelections(selection) {
  return Object.values(selection || {}).some((ids) => Array.isArray(ids) && ids.length > 0);
}
