# NexaSphere — GL Bajaj Group of Institutions, Mathura

**Live Site:** https://Ayushh-Sharmaa.github.io/NexaSphere/  
**Contact:** nexasphere@glbajajgroup.org  
**LinkedIn:** https://www.linkedin.com/showcase/glbajaj-nexasphere/  
**WhatsApp:** https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20

## Tech Stack
React 18 + Vite 5 → GitHub Pages (via GitHub Actions)

## Project Structure
```
src/
  components/     All React UI components
  data/           Team, events, activity page data
  assets/         Images, logos, hero background
  styles/         globals.css, animations.css, components.css
```

## Development
```bash
npm install
npm run dev
```

## Deployment
Push to `main` → GitHub Actions builds and deploys to GitHub Pages automatically.

## Key Links
- Core Team Application: In-built form (see `Apply` tab)
- Join NexaSphere Form: https://forms.gle/NWb49scknwD6PP769
- Code of Conduct: https://tinyurl.com/NexaSphere-COD
- Rules: https://tinyurl.com/NexaSphere-Rules

## Core Team Application (Google Sheets storage)
The in-built application form submits to a small backend (`server/`) which appends each response to a Google Sheet.

### 1) Create / choose a Google Sheet
- Create a sheet and add a tab named `Responses` (or set `GOOGLE_SHEET_TAB_NAME`).
- Share the sheet with your **Google Service Account email** (Editor access).

### 2) Backend setup (local)
```bash
cd server
npm install
```

Create `server/.env`:
```bash
PORT=8787
GOOGLE_SHEET_ID=YOUR_SHEET_ID
GOOGLE_SHEET_TAB_NAME=Responses
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Run the backend:
```bash
npm run dev
```

### 3) Frontend setup
Local dev uses Vite proxy (already configured), so just run:
```bash
npm run dev
```

For production (GitHub Pages), host the backend separately and set:
```bash
VITE_API_BASE=https://your-backend-domain.com
```

## Adding Content
| Task | File |
|---|---|
| Add team member | `src/data/teamData.js` |
| Add activity event | `src/data/activities/<name>.js` |
| Add KSS session | `src/data/activities/insightSession.js` |
| Change hero stats | `src/components/HeroSection.jsx` → `StatsBar` |
| Add photo/video link | `insightSession.js` → `photoLink`/`videoLink` |
