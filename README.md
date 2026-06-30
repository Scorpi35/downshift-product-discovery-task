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
- **Infinite scroll** via IntersectionObserver with a fallback "Load more" button, loading 24 items per page
- **Product cards** showing image, brand, title, truncated description, star rating with review count, price, category badge, out-of-stock badge, and up to three tags
- **Data normalization** layer that cleans inconsistent titles (ALL CAPS, extra whitespace), parses string/null prices, and fills missing defaults on load
- **Loading state** with a spinner, **error state** with retry, and **empty state** with a prompt to clear filters
- **Keyboard shortcut**: `/` to focus search, `Escape` to blur
- **Responsive layout** with CSS grid that adapts column count across breakpoints
- **Skeleton shimmer** placeholders while product images load
- **Staggered fade-in** animations on card entrance and hover lift/zoom effects

## Key Decisions & Why

**Fuse.js with weighted fields.** Title has the highest weight (10), followed by tags (8), category (6), brand (4), and description (2). This means a query matching a product's name ranks higher than one matching only its description, which reflects how users typically search for products.

**`ignoreLocation: true` and threshold 0.35.** `ignoreLocation` ensures matches anywhere in a field count equally, so "oak bin" works regardless of where those words appear. The 0.35 threshold provides reasonable typo tolerance without returning too many irrelevant results.

**Bayesian-style default sort.** When there is no active search query, the relevance sort uses a confidence-weighted score: `rating * (1 - 1/(1 + reviews))`. This prevents a single 5-star review from outranking a product with 4.8 stars across hundreds of reviews. Items with zero reviews are pushed to the bottom.

**Client-side search.** The full catalog is approximately 1.4 MB. Fetching it once and searching in-memory with Fuse.js avoids round-trip latency on every keystroke and keeps the interaction feeling instant. This is a reasonable tradeoff at 4,000 items.

**Express proxy server.** The catalog endpoint does not include CORS headers. Rather than relying solely on Vite's dev proxy (which would not work in production), a lightweight Express server fetches the data server-side. Vite's proxy routes `/api/*` to this server during development.

**Data normalization on load.** The raw data has inconsistent casing, string-formatted prices with commas, and null values for ratings, images, and descriptions. Normalizing once on fetch means components never need to handle these edge cases individually.

**Infinite scroll over traditional pagination.** For a discovery-oriented browsing experience, continuous scrolling feels more natural. The IntersectionObserver fires 200px before the sentinel enters the viewport, so new items appear before the user reaches the bottom.

## Tradeoffs

Given the time constraint, several improvements were intentionally left out:

- **Debounced search input.** Fuse.js is fast enough on 4,000 items that debouncing was not necessary, but it would matter at larger catalog sizes.
- **Search result highlighting.** Matched terms are not visually highlighted within product cards.
- **URL-synced filters.** Filter and search state is not persisted in the URL, so refreshing or sharing a link loses the current view.
- **Backend search.** At 50,000+ items, client-side search would degrade; a server-side search index (e.g., Meilisearch, Elasticsearch) would be needed.
- **Search suggestions and synonyms.** There is no typeahead or synonym mapping (e.g., "chair" to "furniture").
- **Analytics.** No tracking of search queries, filter usage, or zero-result rates.

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
