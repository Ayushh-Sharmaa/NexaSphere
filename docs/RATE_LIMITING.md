# Dynamic Rate Limiting via Redis Token Bucket

We have implemented a dynamic rate limiting middleware based on the **Token Bucket** algorithm, backed by Redis.

## Architecture

Instead of static IP-based blocking (which penalizes large NATs), rate limiting is now:

1. **User-based**: Limits are applied per authenticated user ID (falling back to IP for unauthenticated traffic).
2. **Cost-based**: Not all requests are equal. A simple REST GET might cost 10 tokens, while a complex GraphQL query might cost 500 tokens based on its depth and requested fields.

### Redis Implementation (\`RateLimitService\`)

We use a Token Bucket algorithm stored in Redis Hashes.

- Each user has a bucket with a maximum capacity (e.g., 1000 tokens).
- The bucket refills at a constant rate (e.g., 10 tokens per second).
- When a request comes in, the cost is subtracted from the bucket.
- If the bucket has insufficient tokens, a \`429 Too Many Requests\` response is returned.

### GraphQL Integration

We integrate the \`graphql-cost-analysis\` library into the Apollo Gateway. Before a query executes, its cost is calculated. If it exceeds the maximum allowed cost, the query is rejected immediately with a \`BAD_USER_INPUT\` error, protecting the subgraphs from resource exhaustion.
