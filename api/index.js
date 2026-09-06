// Vercel serverless entrypoint. Combined with the /api/(.*) rewrite in
// vercel.json, every request under /api/* is routed here, which simply
// delegates to the real Express app defined in server/index.js — the same
// app used for traditional/long-running hosts (Render, Railway, a VPS,
// etc.) via `node server/index.js`. This keeps a single source of truth
// for every route instead of duplicating logic per-platform.
import app from '../server/index.js';

export default function handler(req, res) {
  return app(req, res);
}
