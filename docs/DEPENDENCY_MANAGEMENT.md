# Automated Dependency Update Management with Supply Chain Security

We have automated the tedious process of keeping dependencies up-to-date while simultaneously bolstering our defenses against supply chain attacks.

## Renovate Bot

We use [Renovate](https://docs.renovatebot.com/) to monitor our \`package.json\` files.

- The configuration is stored in \`renovate.json\`.
- It groups related packages (e.g., React and React-DOM) into single PRs to reduce noise.
- It is configured to run weekly (Monday mornings).
- **Auto-merge**: Patch and Minor version updates are configured to auto-merge, *provided all CI checks pass*.

## Supply Chain Security (Socket.dev)

Blindly auto-merging dependencies is dangerous due to the rise of malicious NPM packages. We use **Socket.dev** to scan dependencies proactively.

- The GitHub Action \`.github/workflows/dependency-security-scan.yml\` runs on every PR that modifies \`package.json\`.
- Socket analyzes the actual package code for:
  - Anomalous network access (e.g., a logging library suddenly trying to reach out to the internet).
  - Malicious install scripts (\`postinstall\`).
  - Typo-squatting.
  - Known vulnerabilities (CVEs).
- **Enforcement**: If Socket detects anomalous behavior, the CI pipeline fails. This blocks Renovate's auto-merge, forcing a human developer to manually review the flagged package before it enters the codebase.
