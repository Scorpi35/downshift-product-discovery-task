import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeItems, extractCategories, extractBrands } from './utils/data';
import { useProductSearch } from './hooks/useProductSearch';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import SkeletonCard from './components/SkeletonCard';
import './App.css';

const DATA_URL = '/api/products';
const INITIAL_LOAD_DELAY = 1200;

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const sentinelRef = useRef(null);

  // Load data on mount with intentional delay to showcase loading state
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        const normalized = normalizeItems(data);
        // Artificial delay so the loading UI is always visible
        await new Promise((resolve) => setTimeout(resolve, INITIAL_LOAD_DELAY));
        setItems(normalized);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const categories = extractCategories(items);
  const brands = extractBrands(items);

  const search = useProductSearch(items);

  // Infinite scroll via IntersectionObserver
  const observerCallback = useCallback(
    (entries) => {
      if (entries[0].isIntersecting && search.hasMore && !search.loadingMore) {
        search.loadMore();
      }
    },
    [search.hasMore, search.loadMore, search.loadingMore]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [observerCallback]);

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Loading catalog…</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="app-error">
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="container">
          <div className="header-content">
            <div className="header-brand">
              <h1 className="header-logo">
                <span className="logo-accent">◆</span> DownShift Store
              </h1>
              <p className="header-tagline">Curated home goods, handpicked for you</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app-main">
        <div className="container">
          {/* Search */}
          <section className="search-section" aria-label="Search products">
            <SearchBar
              query={search.query}
              setQuery={search.setQuery}
              totalResults={search.totalResults}
              totalItems={items.length}
            />
          </section>

          {/* Filters */}
          <section className="filter-section" aria-label="Filter products">
            <FilterBar
              categories={categories}
              brands={brands}
              selectedCategory={search.selectedCategory}
              setSelectedCategory={search.setSelectedCategory}
              selectedBrand={search.selectedBrand}
              setSelectedBrand={search.setSelectedBrand}
              selectedPriceRange={search.selectedPriceRange}
              setSelectedPriceRange={search.setSelectedPriceRange}
              inStockOnly={search.inStockOnly}
              toggleInStock={search.toggleInStock}
              sortBy={search.sortBy}
              setSortBy={search.setSortBy}
              activeFilterCount={search.activeFilterCount}
              clearFilters={search.clearFilters}
            />
          </section>

          {/* Results grid */}
          {search.results.length > 0 ? (
            <section className="products-section" aria-label="Product results">
              <div className="products-grid">
                {search.results.map((item, index) => (
                  <ProductCard key={item.id} item={item} index={index} />
                ))}
              </div>

              {/* Infinite scroll sentinel */}
              <div ref={sentinelRef} className="scroll-sentinel" />

              {/* Skeleton cards while loading more */}
              {search.loadingMore && (
                <div className="products-grid skeleton-grid">
                  {Array.from({ length: 6 }, (_, i) => (
                    <SkeletonCard key={`skeleton-${i}`} />
                  ))}
                </div>
              )}

              {search.hasMore && !search.loadingMore && (
                <div className="load-more-wrapper">
                  <button className="load-more-btn" onClick={search.loadMore}>
                    Load more products
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="empty-state">
              <div className="empty-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <h2>No products found</h2>
              <p>
                Try adjusting your search or filters to find what you&apos;re looking for.
              </p>
              <button className="empty-clear-btn" onClick={() => { search.setQuery(''); search.clearFilters(); }}>
                Clear all filters
              </button>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} DownShift Store. Crafted with care.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
