import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

git add .
git commit -m "setup vite react project"
git push origin main
```

---

### 2 — Check if the workflow ran
Go to your repo → click **Actions** tab

You should see a workflow called **"Deploy to GitHub Pages"** running or completed.

- 🟡 Yellow = still running, wait 1-2 mins
- ✅ Green = done, `gh-pages` branch is now created
- ❌ Red = something failed, send me the error

---

### 3 — After it goes green, go to Settings → Pages
Now the `gh-pages` branch will appear in the dropdown.

Set it like this:
```
Source:  Deploy from a branch
Branch:  gh-pages
Folder:  / (root)
