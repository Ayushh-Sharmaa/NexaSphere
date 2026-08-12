# Circuit Breaker Pattern for 3rd-Party Integrations

We have implemented the **Circuit Breaker** pattern to protect NexaSphere from cascading failures caused by outages in external third-party APIs (like email or payment gateways).

## How it works

1. **Closed (Normal)**: Requests flow through to the 3rd-party API normally.
2. **Open (Failing Fast)**: If the error rate exceeds a threshold (e.g., 50% of requests fail within a window), the circuit "opens." Subsequent requests are immediately rejected (or routed to a fallback) without attempting to hit the external API. This prevents our backend from exhausting connection pools and hanging threads.
3. **Half-Open (Recovery Testing)**: After a reset timeout (e.g., 10 seconds), the circuit allows a single test request through. If it succeeds, the circuit closes. If it fails, it opens again.

## Distributed State via Redis

Because NexaSphere is a clustered microservice architecture, a circuit breaker residing in the memory of a single Node.js process is insufficient.
We implemented a \`DistributedCircuitBreaker\` (\`backend/services/circuitBreaker.js\`) that syncs its state to Redis. If Pod A detects an outage and opens its circuit, it writes "OPEN" to Redis. Pod B will read this state and instantly fail-fast, avoiding the need to discover the outage independently.

## Usage

Use \`circuitBreakerService.createBreaker(name, action, fallback)\` to wrap any outbound HTTP requests. See \`backend/services/thirdPartyApi.js\` for an implementation example.
