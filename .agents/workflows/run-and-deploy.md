---
description: How to run, preview, and deploy Roomio
---

# Running & Deploying Roomio

// turbo-all

## Local Development

### Option 1: Dev Server (with live-reload)
```
npm start
```

### Option 2: Static Preview
```
npm run preview
```

### Option 3: Just Open It
Open `index.html` directly in a browser. No server needed.

## Deployment

### Netlify
1. Push to a Git repo
2. Connect to Netlify
3. Auto-deploys from `netlify.toml` — no build step needed

### Vercel
1. Push to a Git repo
2. Connect to Vercel
3. Auto-deploys from `vercel.json` — no build step needed

### GitHub Pages
1. Go to Settings → Pages
2. Source: `main` branch, folder: `/`
3. Save

### Any Static Host
Upload all `.html`, `.css`, `.js` files. No build step required.

## Production Notes
- The app is a **static site** — no Node.js required in production
- No build process, no bundling — source files _are_ the production files
- Zero dependencies — everything is loaded via CDN (Lucide icons, Google Fonts)
