import { useState, useMemo, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import { PRICE_RANGES } from '../utils/data';

const ITEMS_PER_PAGE = 50;
const LOAD_MORE_DELAY = 800;

export function useProductSearch(items) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  // Initialize Fuse instance
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'title', weight: 10 },
        { name: 'tags', weight: 8 },
        { name: 'category', weight: 6 },
        { name: 'brand', weight: 4 },
        { name: 'description', weight: 2 }
      ],
      threshold: 0.35,      // Standard typo tolerance threshold
      ignoreLocation: true, // Matches search terms anywhere in the field (order-independent)
      includeScore: true,
    });
  }, [items]);

  const filteredAndSorted = useMemo(() => {
    let results = [];

    if (query.trim()) {
      // Use Fuse.js search
      const searchResults = fuse.search(query);
      results = searchResults.map((r) => ({
        item: r.item,
        score: 1 - (r.score || 0), // Higher is better
      }));
    } else {
      // Return all items
      results = items.map((item) => ({
        item,
        score: 1,
      }));
    }

    // Apply filters
    if (selectedCategory) {
      results = results.filter((r) => r.item.category === selectedCategory);
    }
    if (selectedBrand) {
      results = results.filter((r) => r.item.brand === selectedBrand);
    }
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      results = results.filter((r) => {
        const price = r.item.price;
        if (price == null) return false;
        return price >= range.min && price < range.max;
      });
    }
    if (inStockOnly) {
      results = results.filter((r) => r.item.inStock);
    }

    // Sort
    results.sort((a, b) => {
      switch (sortBy) {
        case 'relevance': {
          if (query.trim()) return b.score - a.score;
          // Default catalog sorting: reviewed items first, ranked by weighted score
          const aReviews = a.item.reviews || 0;
          const bReviews = b.item.reviews || 0;
          // Push no-review items to the very end
          if (aReviews === 0 && bReviews > 0) return 1;
          if (bReviews === 0 && aReviews > 0) return -1;
          if (aReviews === 0 && bReviews === 0) return 0;
          // Bayesian-style score: rating weighted by confidence from review count
          const aScore = (a.item.rating || 0) * (1 - 1 / (1 + aReviews));
          const bScore = (b.item.rating || 0) * (1 - 1 / (1 + bReviews));
          return bScore - aScore;
        }
        case 'price-asc':
          return (a.item.price ?? Infinity) - (b.item.price ?? Infinity);
        case 'price-desc':
          return (b.item.price ?? -1) - (a.item.price ?? -1);
        case 'rating':
          return (b.item.rating ?? 0) - (a.item.rating ?? 0);
        case 'newest':
          return (
            new Date(b.item.releasedAt).getTime() -
            new Date(a.item.releasedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return results.map((r) => r.item);
  }, [items, query, fuse, selectedCategory, selectedBrand, selectedPriceRange, inStockOnly, sortBy]);

  const paginatedItems = useMemo(() => {
    return filteredAndSorted.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredAndSorted, page]);

  const hasMore = paginatedItems.length < filteredAndSorted.length;

  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setTimeout(() => {
      setPage((p) => p + 1);
      setLoadingMore(false);
      loadingRef.current = false;
    }, LOAD_MORE_DELAY);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedBrand) count++;
    if (selectedPriceRange !== null) count++;
    if (inStockOnly) count++;
    return count;
  }, [selectedCategory, selectedBrand, selectedPriceRange, inStockOnly]);

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedPriceRange(null);
    setInStockOnly(false);
    setPage(1);
  }, []);

  // Reset page when any filter changes
  const updateQuery = useCallback((q) => {
    setQuery(q);
    setPage(1);
  }, []);

  const updateCategory = useCallback((cat) => {
    setSelectedCategory((prev) => (prev === cat ? null : cat));
    setPage(1);
  }, []);

  const updateBrand = useCallback((brand) => {
    setSelectedBrand((prev) => (prev === brand ? null : brand));
    setPage(1);
  }, []);

  const updatePriceRange = useCallback((idx) => {
    setSelectedPriceRange((prev) => (prev === idx ? null : idx));
    setPage(1);
  }, []);

  const toggleInStock = useCallback(() => {
    setInStockOnly((prev) => !prev);
    setPage(1);
  }, []);

  const updateSortBy = useCallback((sort) => {
    setSortBy(sort);
    setPage(1);
  }, []);

  return {
    query,
    setQuery: updateQuery,
    selectedCategory,
    setSelectedCategory: updateCategory,
    selectedBrand,
    setSelectedBrand: updateBrand,
    selectedPriceRange,
    setSelectedPriceRange: updatePriceRange,
    inStockOnly,
    toggleInStock,
    sortBy,
    setSortBy: updateSortBy,
    results: paginatedItems,
    loadingMore,
    totalResults: filteredAndSorted.length,
    hasMore,
    loadMore,
    activeFilterCount,
    clearFilters,
  };
}
