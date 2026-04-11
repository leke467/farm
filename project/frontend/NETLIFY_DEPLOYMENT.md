# Netlify Deployment Guide

## Files Included

This project includes everything needed for Netlify deployment:

### 1. `_redirects` (in public folder)
- Redirects all routes to `index.html` for SPA functionality
- Automatically copied to `dist/` during build
- Ensures page reloads work correctly on all routes

### 2. `netlify.toml` (root directory)
- Netlify build configuration
- Cache control rules for optimal performance
- Security headers for protection
- SPA redirect configuration

### 3. `server.mjs` (for local production testing)
- Express server for testing production build locally
- Run with: `npm start` (after `npm run build`)
- Serves from port 5176

## Deployment Steps

### Option 1: Connect GitHub to Netlify (Recommended)

1. Push code to GitHub
2. Go to [Netlify](https://app.netlify.com)
3. Click "New site from Git"
4. Select your GitHub repo
5. Netlify will automatically detect build settings from `netlify.toml`
6. Deploy happens automatically on push to main branch

### Option 2: Manual Deployment

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

## Key Features

- ✅ SPA routing works on all routes (via `_redirects`)
- ✅ Production-optimized builds (code splitting, minification)
- ✅ Security headers included
- ✅ Proper cache control (long-term caching for assets, no-cache for HTML)
- ✅ Auto-redirect HTTP → HTTPS (Netlify default)

## Environment Variables

Set these in Netlify Dashboard → Settings → Build & Deploy → Environment:

```
VITE_API_URL=https://your-backend-url.com/api
NODE_ENV=production
```

## Troubleshooting

**Page reloads return 404?**
- Ensure `_redirects` file is in `dist/` folder
- Check netlify.toml has the redirect rule

**Styles/scripts not loading?**
- Clear browser cache
- Check MIME types in network tab (should be `application/javascript`, `text/css`)
- Verify asset URLs use correct paths (should include `/assets/`)

**Build fails?**
- Check `netlify.toml` build command matches your setup
- Verify all dependencies are in `package.json`
- Check Node version (18+ recommended)
