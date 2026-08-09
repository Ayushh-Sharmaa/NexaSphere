# NexaSphere GraphQL Federation

This directory contains the Apollo Federation setup for NexaSphere.

## Architecture

Instead of a monolithic GraphQL schema, we have broken the graph into multiple composable subgraphs:

- **Accounts** (\`<http://localhost:4001\`>): Manages users and authentication.
- **Collaboration** (\`<http://localhost:4002\`>): Manages projects and teams.
- **Analytics** (\`<http://localhost:4003\`>): Manages metrics and view counts.

The **Gateway** (\`<http://localhost:4000\`>) acts as a router to compose these into a single unified API.

## Running Locally

To run the full federated graph locally, you need to start each subgraph and the gateway:

\`\`\`bash

# Start Accounts subgraph

node subgraphs/accounts/index.js

# Start Collaboration subgraph

node subgraphs/collaboration/index.js

# Start Analytics subgraph

node subgraphs/analytics/index.js

# Start Gateway

node src/index.js
\`\`\`
