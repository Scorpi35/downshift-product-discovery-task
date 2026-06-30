import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Proxy endpoint to fetch the product catalog
app.get('/api/products', async (req, res) => {
  try {
    const response = await fetch('https://media.downshift.app/hiring/founding-engineer/items.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch from catalog: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch catalog items' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server is running on http://localhost:${PORT}`);
});
