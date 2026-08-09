# Event-Sourcing Pattern for Audit Logging

We have implemented an Event Sourcing architecture to provide rigorous forensic audit logging and state recovery for critical domains (e.g., Documents).

## Architecture

Instead of updating a record in place (which destroys historical state), we append immutable events to an Event Store.

### 1. The Event Store (\`eventStore.js\`)

An append-only ledger that stores the history of everything that has happened in the system.
Events have a specific structure:

- \`id\`: Unique UUID for the event
- \`aggregateId\`: The ID of the entity this event belongs to (e.g., a document ID)
- \`eventType\`: A constant describing what happened (e.g., \`DocumentTitleUpdated\`)
- \`payload\`: The data associated with the event
- \`metadata\`: Timestamps and actor information

### 2. Projections (\`projections.js\`)

Because the Event Store only contains events, we need a way to answer the question: "What is the current state of this document?"
Projections read a stream of events from the beginning of time and apply them sequentially to reconstruct the current state (a "Read Model").

This pattern is a step towards full CQRS (Command Query Responsibility Segregation).

### 3. API Endpoints

- \`GET /api/audit/log/:aggregateId\`: View the raw immutable event stream for a document.
- \`GET /api/audit/document/:aggregateId/state\`: View the reconstructed current state.
