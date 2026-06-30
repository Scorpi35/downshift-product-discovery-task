import { PRICE_RANGES } from '../utils/data';
import './FilterBar.css';

export default function FilterBar({
  categories,
  brands,
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedPriceRange,
  setSelectedPriceRange,
  inStockOnly,
  toggleInStock,
  sortBy,
  setSortBy,
  activeFilterCount,
  clearFilters,
}) {
  return (
    <div className="filter-bar">
      {/* Category pills */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-pills" role="group" aria-label="Filter by category">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                aria-pressed={selectedCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary filters */}
      <div className="filter-row filter-row-secondary">
        <div className="filter-group">
          <select
            id="brand-filter"
            className="filter-select"
            value={selectedBrand || ''}
            onChange={(e) => setSelectedBrand(e.target.value || null)}
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <select
            id="price-filter"
            className="filter-select"
            value={selectedPriceRange ?? ''}
            onChange={(e) =>
              setSelectedPriceRange(
                e.target.value === '' ? null : Number(e.target.value)
              )
            }
          >
            <option value="">Any Price</option>
            {PRICE_RANGES.map((range, i) => (
              <option key={i} value={i}>
                {range.label}
              </option>
            ))}
          </select>

          <button
            className={`filter-pill filter-pill-icon ${inStockOnly ? 'active' : ''}`}
            onClick={toggleInStock}
            aria-pressed={inStockOnly}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            In stock
          </button>
        </div>

        <div className="filter-group">
          {activeFilterCount > 0 && (
            <button className="filter-clear" onClick={clearFilters}>
              Clear all ({activeFilterCount})
            </button>
          )}

          <select
            id="sort-select"
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevance">Sort: Relevance</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
