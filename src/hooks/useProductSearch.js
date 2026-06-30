import { useState, useEffect, useMemo, useCallback } from 'react';
import { scoreItem, PRICE_RANGES } from '../utils/data';

const LIMIT = 100;

export function useProductSearch() {
  const [fetchedItems, setFetchedItems] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');

  // Pagination state for default scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch helper
  const fetchPage = useCallback(async (pageNum) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?page=${pageNum}&limit=${LIMIT}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      
      setFetchedItems((prev) => {
        // Deduplicate items
        const existingIds = new Set(prev.map((item) => item.id));
        const newItems = data.items.filter((item) => !existingIds.has(item.id));
        return [...prev, ...newItems];
      });
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial page on mount
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Load more function for scroll sentinel
  const loadMore = useCallback(() => {
    if (loading || !hasMore || query.trim()) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPage(nextPage);
  }, [loading, hasMore, page, query, fetchPage]);

  // Server-side search if local search returns no results
  const [isSearchingServer, setIsSearchingServer] = useState(false);

  // 1. Scan fetched data first
  const localSearchResults = useMemo(() => {
    if (!query.trim()) return null;
    return fetchedItems
      .map((item) => ({ item, score: scoreItem(item, query) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  }, [fetchedItems, query]);

  // Trigger server-side fetch if no matches in fetched data
  useEffect(() => {
    if (!query.trim()) return;

    // Check if we found anything locally
    const hasLocalMatches = localSearchResults && localSearchResults.length > 0;

    // If not available locally, fetch from backend url
    if (!hasLocalMatches && !isSearchingServer) {
      async function searchServer() {
        setIsSearchingServer(true);
        setLoading(true);
        try {
          const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
          if (!res.ok) throw new Error('Failed to fetch search results');
          const data = await res.json();

          setFetchedItems((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = data.items.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
          setIsSearchingServer(false);
        }
      }
      searchServer();
    }
  }, [query, localSearchResults, isSearchingServer]);

  // Filter and sort the current results
  const filteredAndSorted = useMemo(() => {
    // If query is active, use search results; otherwise use all fetched items
    let resultsList = query.trim() ? (localSearchResults || []) : fetchedItems;

    // Apply filters (Category, Brand, Price Range, Stock)
    if (selectedCategory) {
      resultsList = resultsList.filter((item) => item.category === selectedCategory);
    }
    if (selectedBrand) {
      resultsList = resultsList.filter((item) => item.brand === selectedBrand);
    }
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      resultsList = resultsList.filter((item) => {
        const price = item.price;
        if (price == null) return false;
        return price >= range.min && price < range.max;
      });
    }
    if (inStockOnly) {
      resultsList = resultsList.filter((item) => item.inStock);
    }

    // Sort
    const sorted = [...resultsList];
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          if (query.trim()) {
            return scoreItem(b, query) - scoreItem(a, query);
          }
          // Default sort: rating * log(reviews + 1)
          return (
            (b.rating || 0) * Math.log(b.reviews + 1) -
            (a.rating || 0) * Math.log(a.reviews + 1)
          );
        case 'price-asc':
          return (a.price ?? Infinity) - (b.price ?? Infinity);
        case 'price-desc':
          return (b.price ?? -1) - (a.price ?? -1);
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'newest':
          return (
            new Date(b.releasedAt).getTime() -
            new Date(a.releasedAt).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [fetchedItems, query, localSearchResults, selectedCategory, selectedBrand, selectedPriceRange, inStockOnly, sortBy]);

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
  }, []);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedPriceRange,
    setSelectedPriceRange,
    inStockOnly,
    toggleInStock: () => setInStockOnly((prev) => !prev),
    sortBy,
    setSortBy,
    results: filteredAndSorted,
    totalResults: filteredAndSorted.length,
    totalItems: fetchedItems.length,
    hasMore: !query.trim() && hasMore, // Only scroll load when not searching
    loadMore,
    activeFilterCount,
    clearFilters,
    loading,
    error,
    fetchedItems,
  };
}
