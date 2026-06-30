/**
 * Data normalization utilities.
 *
 * The raw data has several quirks:
 * - Titles can be ALL CAPS, lowercase, or have extra whitespace
 * - Prices can be numbers, strings (some with commas like "1,081.43"), or null
 * - Ratings, descriptions, and images can be null
 * - Some items are out of stock
 *
 * We normalize once on load so the UI never has to worry about data quality.
 */

/**
 * Normalize a title to Title Case with cleaned whitespace.
 */
function normalizeTitle(title) {
  if (!title) return 'Untitled Product';
  const cleaned = title.trim().replace(/\s+/g, ' ');

  // If it's all caps or all lowercase, convert to title case
  if (cleaned === cleaned.toUpperCase() || cleaned === cleaned.toLowerCase()) {
    return cleaned
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return cleaned;
}

/**
 * Parse a price that might be a number, a string (possibly with commas), or null.
 */
function parsePrice(price) {
  if (price == null) return null;
  if (typeof price === 'number') return price;
  // Remove commas and parse
  const parsed = parseFloat(String(price).replace(/,/g, ''));
  return isNaN(parsed) ? null : parsed;
}

/**
 * Normalize a single product item.
 */
export function normalizeItem(item) {
  return {
    ...item,
    title: normalizeTitle(item.title),
    price: parsePrice(item.price),
    rating: item.rating ?? null,
    description: item.description ?? null,
    image: item.image ?? null,
    inStock: item.inStock ?? true,
    tags: item.tags ?? [],
  };
}

/**
 * Normalize the entire dataset.
 */
export function normalizeItems(items) {
  return items.map(normalizeItem);
}

/**
 * Extract all unique categories from normalized items.
 */
export function extractCategories(items) {
  const cats = new Set(items.map((item) => item.category));
  return Array.from(cats).sort();
}

/**
 * Extract all unique brands from normalized items.
 */
export function extractBrands(items) {
  const brands = new Set(items.map((item) => item.brand));
  return Array.from(brands).sort();
}

/**
 * Fast Levenshtein distance calculation for typo tolerance.
 */
function levenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Basic English singular/plural normalization.
 */
function stemWord(word) {
  if (word.length <= 2) return word;

  // Plurals ending in ies -> y (e.g. caddies -> caddy)
  if (word.endsWith('ies')) {
    return word.slice(0, -3) + 'y';
  }

  // Plurals ending in es (e.g. boxes -> box, dishes -> dish, benches -> bench, crates -> crate)
  if (word.endsWith('es')) {
    const base = word.slice(0, -2);
    if (
      base.endsWith('sh') ||
      base.endsWith('ch') ||
      base.endsWith('x') ||
      base.endsWith('s') ||
      base.endsWith('z')
    ) {
      return base;
    }
    return word.slice(0, -1); // e.g. crates -> crate
  }

  // Plurals ending in s (e.g. blankets -> blanket)
  if (word.endsWith('s') && !word.endsWith('ss')) {
    return word.slice(0, -1);
  }

  return word;
}

/**
 * Returns a match score between a query term and a target word (0 to 1).
 */
function getWordMatchScore(term, targetWord) {
  const t = term.toLowerCase();
  const w = targetWord.toLowerCase();

  // Exact match
  if (t === w) return 1.0;

  // Stemmed exact match
  const stemmedT = stemWord(t);
  const stemmedW = stemWord(w);
  if (stemmedT === stemmedW) return 0.9;

  // Substring match
  if (w.includes(t) || t.includes(w)) {
    return 0.8;
  }
  if (stemmedW.includes(stemmedT) || stemmedT.includes(stemmedW)) {
    return 0.7;
  }

  // Typo tolerance (Levenshtein distance)
  const lenDiff = Math.abs(t.length - w.length);
  if (lenDiff <= 2 && t.length >= 3 && w.length >= 3) {
    const distance = levenshteinDistance(t, w);
    const maxAllowed = t.length <= 5 ? 1 : 2;
    if (distance <= maxAllowed) {
      return 0.6 - distance * 0.1; // 0.5 or 0.4
    }
  }

  return 0;
}

/**
 * Split a field text into alphanumeric words and find the best match score for the term.
 */
function matchField(term, fieldText) {
  if (!fieldText) return 0;
  const words = fieldText
    .toLowerCase()
    .split(/[^a-z0-9]/)
    .filter(Boolean);
  let maxScore = 0;
  for (const word of words) {
    const score = getWordMatchScore(term, word);
    if (score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
}

/**
 * Forgiving multi-field search scoring with typo tolerance, plural/singular
 * resolution, multiple words support, case-insensitivity, and order-independence.
 */
export function scoreItem(item, query) {
  if (!query) return 1;

  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);

  if (terms.length === 0) return 1;

  let totalScore = 0;

  for (const term of terms) {
    let termScore = 0;

    // Check match across fields, weighted by field importance:
    // title (10) > tags (8) > category (6) > brand (4) > description (2)
    const titleScore = matchField(term, item.title);
    termScore += titleScore * 10;

    const tagMatches = (item.tags || []).map((tag) => getWordMatchScore(term, tag));
    const maxTagScore = Math.max(0, ...tagMatches);
    termScore += maxTagScore * 8;

    const categoryScore = matchField(term, item.category);
    termScore += categoryScore * 6;

    const brandScore = matchField(term, item.brand);
    termScore += brandScore * 4;

    const descScore = matchField(term, item.description);
    termScore += descScore * 2;

    // strict AND match: every word in the query must match at least one field of the product
    if (termScore === 0) return 0;
    totalScore += termScore;
  }

  return totalScore;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format price for display.
 */
export function formatPrice(price) {
  if (price == null) return 'Price on request';
  return `$${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Format rating as stars string.
 */
export function formatRating(rating) {
  if (rating == null) return null;
  return rating.toFixed(1);
}

/**
 * Price range buckets for filtering.
 */
export const PRICE_RANGES = [
  { label: 'Under $100', min: 0, max: 100 },
  { label: '$100 – $500', min: 100, max: 500 },
  { label: '$500 – $1,000', min: 500, max: 1000 },
  { label: '$1,000+', min: 1000, max: Infinity },
];
