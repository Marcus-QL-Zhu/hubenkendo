export function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/['’]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function createUniqueSlug(zh, en, used, prefix = 'item') {
  const base = slugify(en) || slugify(zh) || prefix;
  let candidate = base;
  let index = 2;

  while (used.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  used.add(candidate);
  return candidate;
}
