const stopWords = new Set([
  'the',
  'and',
  'but',
  'was',
  'were',
  'for',
  'with',
  'very',
  'too',
  'this',
  'that',
  'into',
  'room',
  'event',
  'it',
  'a',
  'an',
  'of',
  'to',
  'on',
  'in',
  'is',
  'are',
  'our',
]);

export function extractThemes(text = '') {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !stopWords.has(word));

  const counts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([theme, count]) => ({ theme, count }));
}

export function groupThemes(entries = []) {
  const themesMap = new Map();

  entries.forEach(({ theme, count }) => {
    const normalized = theme.toLowerCase();
    const existing = themesMap.get(normalized);
    if (existing) existing.count += count;
    else themesMap.set(normalized, { theme, count });
  });

  return Array.from(themesMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
