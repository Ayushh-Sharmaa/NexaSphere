# NexaSphere Observability Stack (#1817)

Three pillars: **metrics** (Prometheus), **logs** (ELK), **traces** (Jaeger via OpenTelemetry), with **Grafana** dashboards and **Alertmanager** routing.

## Quick start

```bash
# From repo root — starts API, Redis, gateway, and full observability stack
docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml up -d
```

Optional Python API for scraping:

```bash
docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml --profile python up -d
```

Validate the stack (PowerShell):

```powershell
.\observability\scripts\smoke-test.ps1
```

Run server tests:

```bash
cd server && npm test
```

Python dev environment (IDE type checking):

```powershell
cd server-python
.\scripts\setup-venv.ps1
```

## URLs (local)

| Service       | URL                      | Credentials                                        |
| ------------- | ------------------------ | -------------------------------------------------- |
| Grafana       | <http://localhost:3000>  | admin / `nexasphere` (or `GRAFANA_ADMIN_PASSWORD`) |
| Prometheus    | <http://localhost:9090>  | —                                                  |
| Alertmanager  | <http://localhost:9093>  | —                                                  |
| Kibana        | <http://localhost:5601>  | —                                                  |
| Jaeger        | <http://localhost:16686> | —                                                  |
| Elasticsearch | <http://localhost:9200>  | security disabled (dev only)                       |
| Service | URL | Credentials |
|---------|-----|-------------|
| Grafana | <http://localhost:3000> | admin / `nexasphere` (or `GRAFANA_ADMIN_PASSWORD`) |
| Prometheus | <http://localhost:9090> | — |
| Alertmanager | <http://localhost:9093> | — |
| Kibana | <http://localhost:5601> | — |
| Jaeger | <http://localhost:16686> | — |
| Elasticsearch | <http://localhost:9200> | security disabled (dev only) |

## Application configuration

Copy variables from [`server/.env.example.monitoring`](../server/.env.example.monitoring):

| Variable                      | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `LOG_FORMAT=json`             | Structured logs for ELK parsing                   |
| `METRICS_ENABLED=true`        | Expose `/metrics`                                 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Jaeger OTLP collector (e.g. `http://jaeger:4318`) |
| `OTEL_SERVICE_NAME`           | Service label in traces/logs                      |
| `MONITORING_API_TOKEN`        | Auth for `/api/monitoring/*`                      |
| `SLACK_WEBHOOK_URL`           | Warning alerts                                    |
| `PAGERDUTY_ROUTING_KEY`       | Critical alerts                                   |
| `ERROR_RATE_THRESHOLD`        | Slack alert threshold (default 1%)                |
| `SLOW_REQUEST_THRESHOLD`      | Slow request log threshold (ms)                   |
| Variable | Purpose |
|----------|---------|
| `LOG_FORMAT=json` | Structured logs for ELK parsing |
| `METRICS_ENABLED=true` | Expose `/metrics` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Jaeger OTLP collector (e.g. `http://jaeger:4318`) |
| `OTEL_SERVICE_NAME` | Service label in traces/logs |
| `MONITORING_API_TOKEN` | Auth for `/api/monitoring/*` |
| `SLACK_WEBHOOK_URL` | Warning alerts |
| `PAGERDUTY_ROUTING_KEY` | Critical alerts |
| `ERROR_RATE_THRESHOLD` | Slack alert threshold (default 1%) |
| `SLOW_REQUEST_THRESHOLD` | Slow request log threshold (ms) |

## Log retention

- **Default logs** (`nexasphere-logs-*`): 30-day ILM policy
- **API request logs** (`nexasphere-api-requests-*`): 90-day ILM policy, backed by `server/logs/api-requests-YYYY-MM-DD.log`
- **Compliance logs** (`nexasphere-compliance-*`): 365-day ILM for `audit` / `admin` level entries

ILM policies are applied by the `elasticsearch-setup` container on first boot.

## Kibana searches

```
level:error AND service:nexasphere-api
event:api_request AND status >= 500
method:POST AND path:"/api/admin/login"
traceId:"<from Jaeger>"
userId:"<user-id>"
@timestamp:[now-1h TO now]
```

## Alert severity routing

| Severity | Receiver                                           |
| -------- | -------------------------------------------------- |
| critical | PagerDuty (if `PAGERDUTY_ROUTING_KEY` set) + Slack |
| warning  | Slack                                              |
| info     | suppressed (null receiver)                         |
| Severity | Receiver |
|----------|----------|
| critical | PagerDuty (if `PAGERDUTY_ROUTING_KEY` set) + Slack |
| warning | Slack |
| info | suppressed (null receiver) |

Configure `SLACK_WEBHOOK_URL` and `PAGERDUTY_ROUTING_KEY` in the environment before starting Alertmanager. For local dev, export them in your shell or use a `.env` file loaded by Docker Compose.

## Production (Render / Vercel)

- **Metrics**: Prometheus scrapes `/metrics` from internal network; use Grafana Cloud or self-hosted Prometheus with Render private networking.
- **Logs**: Ship stdout JSON logs via Filebeat/Vector to managed Elasticsearch or forward Render log streams.
- **Traces**: Point `OTEL_EXPORTER_OTLP_ENDPOINT` to Grafana Cloud Tempo or self-hosted Jaeger.
- **CloudWatch**: Not used by default; migrate by replacing Prometheus/ELK exporters with CloudWatch agent if deploying to AWS.

## On-call escalation (configure in your org)

1. **L1** — Slack `#monitoring-alerts` (warning, 5 min ack)
2. **L2** — PagerDuty/Opsgenie on-call rotation (critical, 5 min ack)
3. **L3** — Engineering lead escalation after 15 min unresolved critical

## Dashboards

Provisioned automatically under Grafana folder **NexaSphere**:

- System Overview
- Application
- Database
- Infrastructure
- Business Metrics

## RUM endpoint

`POST /api/monitoring/rum` (Bearer `MONITORING_API_TOKEN`):

```json
{ "durationSeconds": 1.23 }
```

Feeds `nexasphere_page_load_seconds` histogram.

## Team onboarding (5-minute walkthrough)

1. **Start stack** — `docker compose -f docker-compose.yml -f observability/docker-compose.observability.yml up -d`
2. **Grafana** — open <http://localhost:3000> → folder **NexaSphere** → **System Overview**
3. **Prometheus** — <http://localhost:9090> → query `rate(http_requests_total[5m])`
4. **Kibana** — <http://localhost:5601> → Discover → index `nexasphere-logs-*` → filter `level:error`
5. **Jaeger** — <http://localhost:16686> → search service `nexasphere-api` → find slow traces
6. **Alerts** — <http://localhost:9090/alerts> and <http://localhost:9093> (Alertmanager UI)
7. **Grafana** — open <http://localhost:3000> → folder **NexaSphere** → **System Overview**
8. **Prometheus** — <http://localhost:9090> → query `rate(http_requests_total[5m])`
9. **Kibana** — <http://localhost:5601> → Discover → index `nexasphere-logs-*` → filter `level:error`
10. **Jaeger** — <http://localhost:16686> → search service `nexasphere-api` → find slow traces
11. **Alerts** — <http://localhost:9090/alerts> and <http://localhost:9093> (Alertmanager UI)

For production alerting, copy `alertmanager/alertmanager.prod.yml.example` → `alertmanager.local.yml`, fill in Slack/PagerDuty keys, and mount it in compose.

## Acceptance criteria checklist (#1817)

| Criterion | How to verify |
| ------------------------ | ----------------------------------------------------- |
| Metrics for all services | Prometheus targets UP at :9090/targets |
| Alerts configured | Prometheus → Alerts tab shows rules |
| Logs centralized | Kibana Discover shows `nexasphere-logs-*` |
| Traces available | Jaeger UI shows `nexasphere-api` spans |
| Dashboards | Grafana NexaSphere folder (5 dashboards) |
| Log retention | `curl localhost:9200/_ilm/policy/nexasphere-logs-30d` |
| Error tracking wired | `cd server && npm test` (62 tests pass) |
| Criterion | How to verify |
| ----------- | --------------- |
| Metrics for all services | Prometheus targets UP at :9090/targets |
| Alerts configured | Prometheus → Alerts tab shows rules |
| Logs centralized | Kibana Discover shows `nexasphere-logs-*` |
| Traces available | Jaeger UI shows `nexasphere-api` spans |
| Dashboards | Grafana NexaSphere folder (5 dashboards) |
| Log retention | `curl localhost:9200/_ilm/policy/nexasphere-logs-30d` |
| Error tracking wired | `cd server && npm test` (62 tests pass) |
| API request logs searchable | Kibana Discover shows `nexasphere-api-requests-*` |
| Traces available | Jaeger UI shows `nexasphere-api` spans |
| Dashboards | Grafana NexaSphere folder (5 dashboards) |
| Log retention | `curl localhost:9200/_ilm/policy/nexasphere-api-requests-90d` |
| Error tracking wired | `cd server && npm test` |
