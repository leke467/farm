import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5176;
const DIST_PATH = path.join(__dirname, 'dist');

// Set proper MIME types
app.use(express.static(DIST_PATH, {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
    // Enable caching for hashed assets (year)
    if (path.includes('.')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Don't cache HTML
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }
  },
}));

// SPA fallback - serve index.html for all non-asset routes
app.get('*', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Production server running at http://localhost:${PORT}`);
  console.log(`✓ Serving from: ${DIST_PATH}`);
});
