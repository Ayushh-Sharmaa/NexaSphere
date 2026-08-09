# NexaSphere GraphQL Gateway - Phase 1

Implements Phase 1 of #3452: a GraphQL facade over the existing server/ REST API,
starting with the events domain.

## What this is (and isnt)

Not yet a federated gateway (Apollo Federation, multiple subgraphs, entity resolution).
This is a single Apollo Server whose resolvers call the existing REST endpoints under
server/. Proves the schema/resolver pattern end-to-end before rearchitecting server/
or adding a users service.

## Roadmap

- Phase 1 (this PR): standalone GraphQL server wrapping GET /api/content/events
- Phase 2: convert server/ into a proper GraphQL subgraph (Apollo Federation), add a
  dedicated users subgraph, wire this gateway to compose them
- Phase 3: migrate website/src/utils/api.js to a GraphQL client, incrementally,
  behind a feature flag

## Running locally

cd graphql-gateway
npm install
$env:NEXASPHERE_SERVER_URL="<http://localhost:8787>"; npm run dev

Requires the existing server/ API running on port 8787.
