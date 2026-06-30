import { useState, useMemo, useCallback } from 'react';
import { scoreItem, PRICE_RANGES } from '../utils/data';

const ITEMS_PER_PAGE = 24;

export function useProductSearch(items) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);

  const filteredAndSorted = useMemo(() => {
    let results = items.map((item) => ({
      item,
      score: scoreItem(item, query),
    }));

    // Filter out non-matches when there's a query
    if (query.trim()) {
      results = results.filter((r) => r.score > 0);
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
        case 'relevance':
          if (query.trim()) return b.score - a.score;
          // If no query, sort by a reasonable default: rating * reviews
          return (
            (b.item.rating || 0) * Math.log(b.item.reviews + 1) -
            (a.item.rating || 0) * Math.log(a.item.reviews + 1)
          );
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
  }, [items, query, selectedCategory, selectedBrand, selectedPriceRange, inStockOnly, sortBy]);

  const paginatedItems = useMemo(() => {
    return filteredAndSorted.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredAndSorted, page]);

  const hasMore = paginatedItems.length < filteredAndSorted.length;

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
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
    totalResults: filteredAndSorted.length,
    hasMore,
    loadMore,
    activeFilterCount,
    clearFilters,
  };
}
