# Load Testing — Issue #1567

Load test suite for API + database scalability testing (1000+ concurrent users), built with [Artillery](https://www.artillery.io/).

## What's covered

- `GET /api/content/events` — event listing (50% of traffic)
- `POST /api/content/events/:eventId/register` — event registration (30% of traffic)
- `GET /api/users` — public user listing (20% of traffic)

## Test phases

| Phase | Duration | Load | Purpose |
|---|---|---|---|
| Warm up | 60s | 10 req/s | Baseline |
| Ramp to 1000+ concurrent | 120s | 50 → 200 req/s | Simulate growth to target concurrency |
| Sustained peak load | 180s | 200 req/s | Steady-state stress |
| Large event stress spike | 60s | 500 req/s | Simulate a large-event traffic burst |

## Running the tests

\`\`\`bash
npm install --save-dev artillery artillery-plugin-metrics-by-endpoint
npx artillery run load-tests/nexasphere-load-test.yml --output load-tests/report.json
\`\`\`

Update \`config.target\` in \`nexasphere-load-test.yml\` to point at the environment under test.

Console output (with \`metrics-by-endpoint\` enabled) reports p95/p99 latency and error rate per endpoint — use this to identify bottlenecks and document scaling limits per the issue's acceptance criteria.

## ⚠️ Known blocker: cannot run against local server/index.js

While setting up this test, the local dev server failed to start due to a series of pre-existing, unrelated bugs in \`server/index.js\`:

- Duplicate \`import\` declarations (\`cors\`, \`fs\`, bull-board imports triplicated, etc.)
- Duplicate \`const\` declarations (e.g. \`adminAuth\` declared twice)
- Several imported names collide with local function/const declarations of the same name (e.g. \`contentStore.js\` exports imported, then redefined locally)
- Multiple unclosed code blocks (missing \`}\`/\`)\`) in the CORS/helmet setup, session logging middleware, and idle-timeout middleware — likely from unresolved merge conflicts
- References to routers/functions that are never imported (\`dashboardRouter\`, \`recoveryRouter\`, \`auditToolsRouter\`, \`segmentsRouter\`, \`uploadWithMagicCheck\`)
- A fully dead, unreachable second server bootstrap block at the end of the file

\`git log --oneline -- server/index.js\` shows a long history of merge commits marked "(resolved conflicts)" — this looks like accumulated damage from repeated bad conflict resolution, not something introduced by this branch.

**This load test suite is ready to run** against any working instance (local once \`index.js\` is fixed, or a staging/deployed environment). Flagging this blocker separately since fixing \`index.js\` fully is out of scope for this testing issue.
