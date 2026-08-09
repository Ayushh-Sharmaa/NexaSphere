# Horizontal Scaling Architecture & Strategy Guide

This guide details the horizontal scaling strategy, load balancer setup, and cache/socket state sharing configured for NexaSphere.

---

## 1. Load Balancing Setup (Nginx Gateway)

Nginx is placed at the front of the application architecture to act as a reverse proxy and load balancer.

### Configuration (`gateway/nginx.conf`)

- It defines an `upstream` block targeting the `api` service containers on port `8787`:

  ```nginx
  upstream backend_server {
      server api:8787;
  }
  ```

- Because the `api` containers are deployed on a Docker custom network, Docker’s embedded DNS server dynamically resolves the `api` name to all running container IPs, performing round-robin load balancing.
- HTTPS/SSL termination occurs at Nginx, routing secure client requests to backend containers.

---

## 2. Session & Cache Sharing (Redis)

When multiple instances of the backend API run concurrently, standard in-memory caches and rate-limiting counters are fragmented. We utilize Redis to share this state globally.

### 2.1 Centralized Rate Limiting

- Rate limiters defined in `server/middleware/rateLimiter.js` and `server/middleware/authRateLimiter.js` utilize a shared Redis backend:

  ```javascript
  import { createRateLimitStore } from '../services/rateLimitService.js';

- Rate limiters defined in `server/middleware/rateLimiter.js` and `server/middleware/authRateLimiter.js` utilize a shared Redis backend:

  ```javascript
  import { createRateLimitStore } from '../services/rateLimitService.js';
  
  export const apiRateLimiter = rateLimit({
    store: createRateLimitStore('rate-limit:api:'),
    // ...
  });
  ```

- If Redis is unreachable, the system gracefully falls back to a memory store (`CappedMemoryStore`) to prevent backend crashes.

### 2.2 Socket.IO State Sharing

- Real-time WebSockets are synchronized across all running instances using the `@socket.io/redis-adapter`:

- If Redis is unreachable, the system gracefully falls back to a memory store (`CappedMemoryStore`) to prevent backend crashes.

### 2.2 Socket.IO State Sharing

- Real-time WebSockets are synchronized across all running instances using the `@socket.io/redis-adapter`:

  ```javascript
  const pubClient = getRedisClient();
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  ```

- This ensures that when a socket event is broadcast (e.g., notification alert), it is relayed across all scaled instances and reaches the correct client regardless of which server node they are connected to.

---

## 3. Local Load Testing & Validation

To simulate horizontal scaling and load test local scaling scenarios:

### 3.1 Scaling the Containers

To scale the API service to 3 instances locally:

```bash
docker compose up --scale api=3 --build
```

### 3.2 Running a Load Test

Use `autocannon` or `wrk` to simulate concurrent traffic hitting the gateway:

```bash
# Install autocannon globally
npm install -g autocannon

# Run load test against the gateway (HTTPS localhost)
autocannon -c 100 -d 10 -k https://localhost/health
```

This sends 100 concurrent requests for 10 seconds. You will see requests distributed across the scaled API containers, and Redis logs will show active rate-limiting lookups.
