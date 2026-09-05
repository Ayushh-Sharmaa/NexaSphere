# NexaSphere deployment guide

## Client

Run `npm run build` from the repository root. Vercel serves the generated `dist` directory and the SPA rewrite in `vercel.json` makes all path routes—including `/events/:id` and `/admin`—reload safely.

## Service

Run `npm install` then `npm run dev` in `server/`. The service defaults to port `8787`. Set `VITE_API_BASE` in the client deployment when the API is hosted separately.

The file-backed fallback is suitable for local development. For a deployed shared application workflow, configure the service's database and form-mirroring environment variables rather than relying on ephemeral filesystem storage.
