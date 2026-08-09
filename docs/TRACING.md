# Distributed Tracing Implementation (OpenTelemetry)

We have integrated OpenTelemetry across NexaSphere microservices (Gateway and Backend) to enable distributed tracing.

## Architecture

Distributed tracing allows us to visualize the entire lifecycle of a request as it hops across multiple microservices.

1. **Instrumentation**: We use `@opentelemetry/auto-instrumentations-node` to automatically hook into Express, HTTP, GraphQL, and other libraries without writing manual spans.
2. **Context Propagation**: Trace IDs and Span IDs are injected into HTTP headers by the Gateway and automatically extracted by the Backend.
3. **Exporting**: Spans are exported via OTLP (OpenTelemetry Protocol) over HTTP to a centralized collector (like Jaeger).

## Running Locally

To view the traces locally, spin up the Jaeger container using the provided docker-compose file:

\`\`\`bash
docker-compose -f docker-compose.telemetry.yml up -d
\`\`\`

Then run the services. They default to exporting to \`<http://localhost:4318/v1/traces\`>.
You can view the distributed traces UI at \`<http://localhost:16686\`>.
