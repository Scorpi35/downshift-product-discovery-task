# Haven — Curated Product Discovery

Haven is a premium product discovery page designed for browsing and searching through a catalog of over 4,000 artisan home goods. 

This project consists of a **Vite + React frontend** and a **Node.js + Express backend proxy** that fetches live data from the catalog endpoint to resolve CORS restrictions seamlessly.

---

## 🚀 How to Run Locally

### 1. Installation
In the project directory, run:
```bash
npm install
```

### 2. Run the Development Environment
We use `concurrently` to boot up both the Vite dev server and the Express proxy server in a single command:
```bash
npm run dev
```

*   **Frontend Client:** `http://localhost:5173`
*   **Backend Proxy Server:** `http://localhost:3001`

---

## 🎨 Visual Preview

Here is how the curated catalog discovery interface feels in action:

![Haven Catalog Interface](/Users/scorpi/.gemini/antigravity-ide/brain/aa806428-b2ec-4945-bcd0-06f8942e58e1/initial_state_1782817405697.png)
*Initial loaded state showing the search bar, category selection, and grid.*

![Search Results for 'Terracotta'](/Users/scorpi/.gemini/antigravity-ide/brain/aa806428-b2ec-4945-bcd0-06f8942e58e1/terracotta_results_1782817426093.png)
*Curated filtering and fuzzy matching in action for "terracotta" items.*

---

## 🧠 Architectural & Design Decisions

### 1. The Search Logic (Our Core Focus)
Instead of a naive `.includes()` substring search on a single field, we built a **weighted, multi-field scoring algorithm**:
*   **Search Fields & Weighting**: Matches are checked across `title` (highest weight/exact word matches get bonus points), `category`, `brand`, `tags`, and lastly `description`.
*   **Semantic Matching**: Allows queries like "vintage brass kitchen" to correctly score items matching "vintage" (tag), "brass" (material/title), and "kitchen" (category).
*   **Normalization pipeline**: Before matching or rendering, the raw catalog data is normalized:
    *   Extra spaces and erratic casing (e.g., `  VINTAGE OAK BIN ` and `brushed oak task lamp`) are formatted to clean Title Case.
    *   Price values are sanitized (stripping formatting commas, handling `null` prices with a fallback "Price on request").
    *   Default ratings, descriptions, and empty values are handled gracefully.

### 2. Architecture & Bypassing CORS
*   **Node.js Express Proxy**: To bypass CORS blocks, the backend proxy server sits at `http://localhost:3001` and fetches the remote JSON file server-side.
*   **Vite Reverse Proxy**: The frontend uses Vite's built-in `server.proxy` configuration to route `/api/*` requests to the Node.js backend. This keeps the client code clean, preventing hardcoded server ports or absolute URLs in client fetches.

### 3. Aesthetics & User Experience
*   **Warm Neutrals Palette**: Hues of beige (`#faf8f5`), brass/gold accents (`#b8860b`), and soft borders make the discovery feel like browsing a premium, boutique home goods magazine.
*   **Micro-interactions**: Hover zoom transitions on card images, lift effects, and staggered fade-in animations on load.
*   **Keyboard Shortcut**: Pressing `/` instantly focuses the search bar; pressing `Escape` unfocuses it.
*   **Dynamic Skeleton States**: Custom shimmer animations while loading card images prevent jarring layout shifts.

---

## 🔮 What to Do Next

1.  **Add Auto-Suggest & Synonyms**: Match searches like "chair" to "furniture" and "stool," and "blanket" to "textiles" through a synonym map.
2.  **Add Server-side Search & Pagination**: Right now, all 4k products are fetched and sorted in-memory. As the catalog grows, this should be moved to a search index like Elasticsearch or Meilisearch on the backend.
3.  **Search Analytics**: Log what users search for to understand inventory demand and search failures.

---

## ⚠️ One Major Tradeoff to Watch

*   **In-Memory vs. Server-Side Processing**:
    *   *Currently*: We fetch the entire 4,000-product JSON array to the client once on load. Search, filter, and sort are instant and run on the client.
    *   *The Tradeoff*: While 4k items is small enough to load fast (around 1.4 MB raw), if the catalog grows to 50,000+ items, the page loading times will degrade severely.
    *   *Solution*: When scaling, we would move sorting, filtering, and searching to the Node.js proxy server (leveraging database indexes) and paginate API responses.
