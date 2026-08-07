# Automated Canary Deployments using Istio and Prometheus

We have implemented an automated canary deployment pipeline to safely roll out new versions of core backend services.

## Architecture

Instead of routing 100% of traffic to a new deployment (Blue/Green), we use **Canary Deployments** to expose new code to a small subset of users first.

1. **Metrics Collection**: All backend services now expose a standardized \`/metrics\` endpoint via \`prom-client\`. This tracks HTTP request duration and error rates.
2. **Health Checks**: A standardized \`/health\` endpoint is used by Kubernetes for liveness and readiness probes.
3. **Traffic Splitting**: We use Istio (via Argo Rollouts) to control traffic flow.
   - When a new deployment is triggered, 5% of traffic is routed to the "canary" pods.
   - The system pauses for 10 minutes, evaluating Prometheus metrics.
   - If HTTP 500 errors spike, or latency degrades significantly, the rollout is automatically aborted and 100% of traffic reverts to the stable version.
   - If healthy, the traffic is progressively increased (20%, 50%, 100%).

## Infrastructure Files
- \`infra/k8s/canary-rollout.yaml\`: The Argo Rollouts definition outlining the canary steps and Istio VirtualService integration.
- \`.github/workflows/canary-deployment.yml\`: The CI/CD pipeline that triggers the rollout on pushes to \`main\`.
