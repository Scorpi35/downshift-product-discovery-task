import { useRef, useEffect } from 'react';
import './SearchBar.css';

export default function SearchBar({ query, setQuery, totalResults, totalItems }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <svg
          className="search-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>

        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="Search by name, material, brand, room…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          spellCheck="false"
        />

        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        <kbd className="search-shortcut">/</kbd>
      </div>

      <p className="search-results-count">
        {query.trim() ? (
          <>
            <strong>{totalResults.toLocaleString()}</strong>{' '}
            {totalResults === 1 ? 'result' : 'results'} for &ldquo;{query.trim()}&rdquo;
          </>
        ) : (
          <>
            <strong>{totalResults.toLocaleString()}</strong> of {totalItems.toLocaleString()} products
          </>
        )}
      </p>
    </div>
  );
}
