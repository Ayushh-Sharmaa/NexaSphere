# 🚀 NexaSphere — Deployment Guide

## Step 1 — Install dependencies locally

Open terminal in your project folder and run:

```bash
npm install
```

---

## Step 2 — Test it locally first

```bash
npm run dev
```

Open `http://localhost:5173` — make sure the site loads correctly before deploying.

---

## Step 3 — Add the GitHub Actions workflow

Create this folder + file in your project:

```
.github/
└── workflows/
    └── deploy.yml
```

Paste this inside `deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## Step 4 — Push everything to GitHub

```bash
git add .
git commit -m "deploy nexasphere website"
git push origin main
```

---

## Step 5 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under **Source** → change to **Deploy from a branch**
4. Branch → select **`gh-pages`** → **`/ (root)`**
5. Click **Save**

---

## Step 6 — Wait ~2 minutes

Go to the **Actions** tab in your repo — you'll see the workflow running.  
Once it turns ✅ green, your site is live at:

```
https://Ayushh-Sharmaa.github.io/NexaSphere/
```

---

## ⚠️ Common errors to watch out for

- If the page is **blank** → check `vite.config.js` has `base: '/NexaSphere/'` ✅
- If the **workflow fails** → check the Actions tab and fix the error
