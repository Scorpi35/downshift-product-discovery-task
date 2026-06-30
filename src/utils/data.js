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
 * Simple search scoring — returns a relevance score (higher = better match).
 *
 * Design decision: I'm doing a multi-field weighted search rather than
 * a simple string.includes(). Title matches are weighted highest, then
 * brand, category, tags, and description. This gives much better results
 * than a single-field search for a home goods catalog where people search
 * by material ("brass"), style ("vintage"), room ("kitchen"), or product
 * type ("lantern").
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
    const titleLower = item.title.toLowerCase();
    const brandLower = (item.brand || '').toLowerCase();
    const categoryLower = (item.category || '').toLowerCase();
    const tagsLower = (item.tags || []).join(' ').toLowerCase();
    const descLower = (item.description || '').toLowerCase();

    // Exact word boundary match in title = strongest signal
    if (new RegExp(`\\b${escapeRegex(term)}\\b`).test(titleLower)) {
      termScore += 10;
    } else if (titleLower.includes(term)) {
      termScore += 6;
    }

    // Brand match
    if (brandLower.includes(term)) {
      termScore += 5;
    }

    // Category match — important for browsing
    if (categoryLower.includes(term)) {
      termScore += 7;
    }

    // Tag match
    if (tagsLower.includes(term)) {
      termScore += 4;
    }

    // Description match — weakest signal but still useful
    if (descLower.includes(term)) {
      termScore += 2;
    }

    if (termScore === 0) return 0; // All terms must match something
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
