<!-- markdownlint-disable MD013 -->
# Disaster Recovery & Business Continuity Plan

## Overview

This document outlines the Disaster Recovery (DR) and Business Continuity procedures for NexaSphere. It ensures that in the event of a catastrophic failure, our services can be restored within our target thresholds.

## Recovery Objectives

- **Recovery Time Objective (RTO)**: 1 Hour for full platform recovery.
- **Recovery Point Objective (RPO)**: 5 Minutes (acceptable data loss limit).

## Architecture Redundancy

- **Database**: Automated daily backups are stored in S3 using AWS Backup with a 30-day retention policy and 1-year retention for weekly snapshots. Point-in-time recovery is enabled.
- **Compute Redundancy**: App servers are distributed across multiple Availability Zones in auto-scaling groups. Session state is externalized to Redis.
- **DNS Failover**: Route53 performs health checks (`/api/health`) every 30 seconds. If the primary region fails, DNS traffic is automatically routed to the secondary read-replica region.

## Incident Command & Communication Plan

1. **Detection**: Alerts fire via CloudWatch/Datadog to the DevOps on-call rotation.
2. **Initial Communication**: DevOps updates the public Status Page indicating "Investigating an ongoing outage."
3. **Escalation**: If the outage spans > 15 minutes, the Incident Commander is looped in.
4. **Resolution Communication**: Update the Status Page and draft a post-mortem within 48 hours.

## Failure Scenarios Runbook

### 1. Database Corruption

- **Action**: Restore database from the last automated AWS Backup or via RDS Point-in-Time Recovery.
- **Target ETA**: ~30 minutes.

### 2. Ransomware / Data Destruction

- **Action**: Validate the integrity of immutable S3 backup vaults. Spin up a clean secondary RDS cluster from the most recent verified backup.
- **Target ETA**: 45 - 60 minutes.

### 3. Full Region Failure (e.g., `us-east-1` goes down)

- **Action**: Route53 automatic failover will redirect traffic to `us-west-2`. Promote the read-only RDS replica in the secondary region to become the new primary writer.
- **Target ETA**: 2 - 5 minutes for traffic rerouting; 10 minutes for database promotion.

### 4. Load Balancer / App Server Failure

- **Action**: Auto-Scaling Groups will terminate unhealthy EC2 instances/containers and provision new ones automatically.
- **Target ETA**: Transparent to users (zero downtime).

## Testing the DR Plan

The disaster recovery plan must be tested quarterly. This involves simulating a failover to the secondary region and performing a dry-run restore of the database to ensure data integrity.
