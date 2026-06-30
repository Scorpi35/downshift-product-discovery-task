# Product Discovery Page

## Overview

A product discovery page for browsing and searching a catalog of approximately 4,000 home goods products. The focus was on building a thoughtful search and filtering experience rather than a complete e-commerce application.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8 |
| Search | Fuse.js 7 |
| Backend Proxy | Express 5, Node.js 20 |
| Linting | oxlint |
| Runtime | Node.js v20.20.0 |

## What I Built

- **Fuzzy search** powered by Fuse.js across title, tags, category, brand, and description fields with weighted relevance scoring
- **Filters** for category (pill toggles), brand (dropdown), price range (four predefined buckets), and in-stock status
- **Sorting** by relevance, price (ascending/descending), rating, and newest
- **Infinite scroll** via IntersectionObserver, loading 50 items per page automatically as the user scrolls
- **Product cards** showing image, brand, title, truncated description, star rating with review count, price, category badge, out-of-stock badge, and up to three tags
- **Data normalization** layer that cleans inconsistent titles (ALL CAPS, extra whitespace), parses string/null prices, and fills missing defaults on load
- **Loading states**: initial full-screen loading spinner (1.2s delay), full-grid skeleton cards (12 cards) with shimmer on search/filter changes (600ms delay), and inline skeleton cards (6 cards) on infinite scroll (800ms delay)
- **Sticky search and filter controls** with a glassmorphism blur backdrop to remain visible and accessible at all times during page scroll
- **Keyboard shortcut**: `/` to focus search, `Escape` to blur
- **Responsive layout** with CSS grid that adapts column count across breakpoints
- **Skeleton shimmer** placeholders while product images load
- **Staggered fade-in** animations on card entrance and hover lift/zoom effects

## Key Decisions & Why

**Sticky search & filters.** To ensure a comfortable user experience when browsing over 4,000 items, the search bar and filter controls remain pinned to the top of the viewport. This allows users to adjust filters or refine search terms immediately without having to scroll all the way back to the top of the page. A subtle glassmorphism backdrop blur is used so scrolled content doesn't visually clash with the sticky bar.

**Simulated loading states & skeleton loaders.** To showcase the intended production experience (where queries would be processed asynchronously on a server), artificial delays are introduced. A 1.2s delay occurs on initial catalog load, a 600ms delay occurs on any search input or filter changes to display a full grid of 12 skeleton loaders, and an 800ms delay occurs on scrolling to display 6 loader cards. This provides visual feedback and prevents page layout shifts.

**Fuse.js with weighted fields.** Title has the highest weight (10), followed by tags (8), category (6), brand (4), and description (2). This means a query matching a product's name ranks higher than one matching only its description, which reflects how users typically search for products.

**`ignoreLocation: true` and threshold 0.35.** `ignoreLocation` ensures matches anywhere in a field count equally, so "oak bin" works regardless of where those words appear. The 0.35 threshold provides reasonable typo tolerance without returning too many irrelevant results.

**Bayesian-style default sort.** When there is no active search query, the relevance sort uses a confidence-weighted score: `rating * (1 - 1/(1 + reviews))`. This prevents a single 5-star review from outranking a product with 4.8 stars across hundreds of reviews. Items with zero reviews are pushed to the bottom.

**Client-side search.** The full catalog is approximately 1.4 MB. Fetching it once and searching in-memory with Fuse.js avoids round-trip latency on every keystroke and keeps the interaction feeling instant. This is a reasonable tradeoff at 4,000 items.

**Express proxy server.** The catalog endpoint does not include CORS headers. Rather than relying solely on Vite's dev proxy (which would not work in production), a lightweight Express server fetches the data server-side. Vite's proxy routes `/api/*` to this server during development.

**Data normalization on load.** The raw data has inconsistent casing, string-formatted prices with commas, and null values for ratings, images, and descriptions. Normalizing once on fetch means components never need to handle these edge cases individually.

**Infinite scroll over traditional pagination.** For a discovery-oriented browsing experience, continuous scrolling feels more natural. The IntersectionObserver fires 200px before the sentinel enters the viewport, so new items appear before the user reaches the bottom.

## Tradeoffs

Given the one-hour time constraint, I focused on delivering a polished core search experience rather than implementing every possible enhancement.

Some intentional tradeoffs include:

- **No debounced search.** With a catalog of ~4,000 products, client-side search remains responsive enough that debouncing wasn't necessary.
- **No search result highlighting.** The focus was on returning relevant results before improving visual feedback.
- **No URL-synced state.** Search queries and filters are not persisted in the URL, so they can't be shared or restored after a refresh.
- **Client-side search only.** This keeps the implementation simple and fast for the current dataset. A dedicated search backend would be more appropriate for much larger catalogs.
- **No autocomplete or synonym support.** Searches rely on the entered query without suggestions or synonym expansion.
- **No analytics.** Search queries, filter usage, and zero-result searches are not tracked, limiting opportunities for data-driven improvements.

## Future Enhancements

If I had more time, I would focus on:

- Autocomplete and search suggestions.
- Synonym support and improved typo tolerance.
- More advanced relevance ranking using user behavior signals.
- Faceted filtering (price ranges, ratings, brands, etc.).
- Migrating search to a dedicated search engine for larger datasets.

## Running Locally

Requires Node.js v20+.

```bash
npm install
npm run dev
```

This starts both the Vite dev server (http://localhost:5173) and the Express proxy server (http://localhost:3001) concurrently.

To build for production:

```bash
npm run build
```
