# NexaSphere API Gateway

Nginx reverse proxy handling SSL termination, centralized rate limiting, structured request logging, and routing for the NexaSphere backend.

## Architecture

```
Client (HTTPS :443)
      │
      ▼
┌─────────────────────────────────────────────┐
│            Nginx API Gateway                │
│  ┌─────────────────────────────────────┐   │
│  │  Rate Limiting (3 zones)            │   │
│  │  Request/Response Logging (JSON)    │   │
│  │  SSL Termination (TLS 1.2/1.3)     │   │
│  │  Security Headers                   │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────│───────────────────────────┘
                  │  HTTP (internal)
                  ▼
         ┌────────────────┐
         │  Express API   │  ×2 replicas
         │  api:8787      │  (round-robin)
         └────────────────┘
```

## Acceptance Criteria Coverage

#### Using OpenSSL (macOS/Linux/Git Bash)

## Rate Limit Zones

| Zone          | Routes                                           | Limit           | Burst |
| ------------- | ------------------------------------------------ | --------------- | ----- |
| `api_general` | `/api/*`, `/`                                    | 20 req/s per IP | 40    |
| `api_auth`    | `/api/admin/*`, `/api/auth/*`                    | 5 req/s per IP  | 10    |
| `api_forms`   | `/api/forms/*`, `/api/rsvp/*`, `/api/feedback/*` | 2 req/s per IP  | 5     |

Exceeded limits return `429 Too Many Requests` with a JSON body.

## Log Format

Each request is logged as a JSON object to `/var/log/nginx/access.log`:

```json
{
  "time": "2026-06-18T10:30:00+00:00",
  "remote_addr": "1.2.3.4",
  "method": "POST",
  "uri": "/api/forms/rsvp",
  "status": 200,
  "bytes_sent": 312,
  "request_time": 0.045,
  "upstream_response_time": "0.044",
  "upstream_connect_time": "0.001",
  "upstream_addr": "172.18.0.3:8787",
  "http_referer": "https://nexasphere.in/events",
  "http_user_agent": "Mozilla/5.0 ...",
  "http_x_forwarded_for": "-",
  "request_id": "a1b2c3d4e5f6..."
}
```

Logs are persisted to `logs/nginx/` on the host so they survive container restarts.

## Setup

### 1. Generate SSL certificates (dev)

```bash
bash gateway/generate-certs.sh
```

#### Using PowerShell (Windows)

### 2. Start the gateway

```bash
# Start everything
docker compose up

# Gateway + dependencies only
docker compose up gateway redis api
```

The gateway will be available at:

- `http://localhost` → redirects to HTTPS
- `https://localhost` → API gateway (accept the self-signed cert warning in dev)

### 3. Windows (PowerShell) certificate generation

```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -nodes -days 365 `
  -newkey rsa:2048 `
  -keyout gateway\certs\localhost.key `
  -out    gateway\certs\localhost.crt `
  -subj   "/C=IN/ST=UP/L=GreaterNoida/O=NexaSphere/CN=localhost"
```

## Testing

### Verify routing

```bash
curl -k https://localhost/health
# Expected: {"status":"ok"} with 200
```

### Verify rate limiting

```bash
# Send 50 rapid requests — should see 429 after burst is exhausted
for i in $(seq 1 50); do
  curl -sk -o /dev/null -w "%{http_code}\n" https://localhost/api/events
done
```

### Verify SSL redirect

```bash
curl -v http://localhost/api/events
# Expected: HTTP/1.1 301, Location: https://localhost/api/events
```

### Verify logs

```bash
# Tail the access log
tail -f logs/nginx/access.log | jq .

# Check error log
tail -f logs/nginx/error.log
```

### Verify security headers

```bash
curl -sk -I https://localhost/health | grep -E "Strict-Transport|X-Frame|X-Content"
```

## File Structure

```
gateway/
├── nginx.conf          — main Nginx config (all 5 AC implemented here)
├── generate-certs.sh   — generates self-signed certs for dev
├── errors/
│   ├── 429.json        — rate limit exceeded response
│   └── 50x.json        — upstream error response
├── certs/              — SSL certificates (git-ignored)
│   ├── localhost.crt
│   └── localhost.key
└── README.md

logs/
└── nginx/              — Nginx access + error logs (git-ignored, created by Docker)
```

This directory contains the Nginx API gateway configuration for routing, rate limiting, request logging, and SSL termination.

## SSL Certificate Setup

Nginx is configured to terminate SSL on port 443 using certificates at `gateway/certs/localhost.crt` and `gateway/certs/localhost.key`.

### Generating Self-Signed Certificates

#### Using OpenSSL (macOS/Linux/Git Bash)

Run the following command in this directory to generate a self-signed certificate:

```bash
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/localhost.key \
  -out certs/localhost.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Using PowerShell (Windows)

If you have Git installed, OpenSSL is available in your Git installation. Run:

```powershell
& "C:\Program Files\Git\usr\bin\openssl.exe" req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certs/localhost.key -out certs/localhost.crt -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

Otherwise, you can install `mkcert` or configure custom certificates for your local domain.
