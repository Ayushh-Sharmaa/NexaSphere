# Edge-Caching GraphQL Queries using Cloudflare Workers

We have implemented an Edge-Caching layer to drastically reduce database load and improve global latency for highly-requested, rarely-changing GraphQL queries.

## Architecture

Standard GraphQL uses \`POST\` requests, which CDNs (like Cloudflare or CloudFront) do not cache by default, because POST requests are intended to mutate data.

To solve this, we use **Automatic Persisted Queries (APQ)**.

1. **Client**: The frontend hashes the GraphQL query string (SHA-256) and sends a \`GET\` request containing only the hash in the URL parameters.
2. **Edge (Cloudflare Worker)**:
   - The Cloudflare Worker (\`workers/graphql-edge-cache/index.js\`) intercepts the \`GET\` request.
   - It checks the local Edge CDN Cache for that specific URL (hash).
   - If found (Cache Hit), it serves the JSON instantly (<10ms) without ever hitting our AWS region.
3. **Gateway (Origin)**:
   - If not found (Cache Miss), the Worker forwards the \`GET\` request to our Apollo Gateway.
   - We updated \`graphql-gateway/src/index.js\` to enable \`persistedQueries\`. The Gateway looks up the hash. If it recognizes it, it executes the query and returns the result. If not, it returns \`PersistedQueryNotFound\`, prompting the client to send the full query string via POST so the Gateway can cache the hash-to-query mapping.
4. **Worker Caching**: On a successful response from the origin, the Worker injects \`Cache-Control\` headers and writes the payload to the CDN Cache.

## Deployment

Install Wrangler CLI and run from the \`workers/graphql-edge-cache\` directory:
\`\`\`bash
npm i -g wrangler
wrangler deploy
\`\`\`
