import express from 'express';
import cors from 'cors';
import { normalizeItems, scoreItem } from './src/utils/data.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

let cachedItems = null;

// Helper to get and cache catalog items
async function getCatalog() {
  if (cachedItems) return cachedItems;

  const response = await fetch('https://media.downshift.app/hiring/founding-engineer/items.json');
  if (!response.ok) {
    throw new Error(`Failed to fetch from catalog: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  cachedItems = normalizeItems(data);
  return cachedItems;
}

// Proxy and search endpoint
app.get('/api/products', async (req, res) => {
  try {
    const catalog = await getCatalog();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const q = req.query.q || '';

    let filtered = catalog;

    // Search query scoring & filtering
    if (q.trim()) {
      filtered = catalog
        .map(item => ({ item, score: scoreItem(item, q) }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.item);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedItems = filtered.slice(startIndex, endIndex);
    const hasMore = endIndex < filtered.length;

    res.json({
      items: paginatedItems,
      hasMore,
      total: filtered.length
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch catalog items' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
