const { Octokit } = require("@octokit/rest");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("GITHUB_TOKEN is required");
    process.exit(1);
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

  const octokit = new Octokit({
    auth: token,
  });

  const MAX_ITEMS = 800; // max items per type (PR / Issue)
  let prsProcessed = 0;
  let issuesProcessed = 0;

  console.log(`Starting retrospective labelling for ${owner}/${repo}...`);

  let page = 1;
  const per_page = 100;
  let hasMore = true;

  while (hasMore && (prsProcessed < MAX_ITEMS || issuesProcessed < MAX_ITEMS)) {
    try {
      console.log(`Fetching page ${page}...`);
      const { data: issues, headers } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "all",
        per_page,
        page,
        sort: "created",
        direction: "desc",
      });

      if (issues.length === 0) {
        hasMore = false;
        break;
      }

      for (const issue of issues) {
        const isPR = !!issue.pull_request;

        if (isPR && prsProcessed >= MAX_ITEMS) continue;
        if (!isPR && issuesProcessed >= MAX_ITEMS) continue;

        if (isPR) prsProcessed++;
        else issuesProcessed++;

        const number = issue.number;
        const author = issue.user ? issue.user.login : "unknown";
        const existingLabels = new Set(
          issue.labels.map((l) => (typeof l === "string" ? l : l.name))
        );

        console.log(
          `Processing #${number} (${isPR ? "PR" : "Issue"}) by @${author}`
        );

        const toAdd = [];

        // --- Shared Labels ---
        if (!existingLabels.has("GSSoC'26")) {
          toAdd.push("GSSoC'26");
        }
        if (!existingLabels.has("gssoc approved")) {
          toAdd.push("gssoc approved");
        }

        if (!existingLabels.has("mentor:Ayushh-Sharmaa")) {
          toAdd.push("mentor:Ayushh-Sharmaa");
        }

        if (isPR) {
          // --- PR Specific Labels ---
          let prDetails;
          try {
            const { data: prData } = await octokit.rest.pulls.get({
              owner,
              repo,
              pull_number: number,
            });
            prDetails = prData;
          } catch (e) {
            console.error(
              `Failed to fetch PR #${number} details: ${e.message}`
            );
            continue;
          }

          const additions = prDetails.additions || 0;
          const deletions = prDetails.deletions || 0;
          const changedFiles = prDetails.changed_files || 0;
          const totalChanges = additions + deletions;

          // Difficulty Label
          let autoLevel = "level:beginner";
          if (totalChanges > 500 || changedFiles > 15)
            autoLevel = "level:critical";
          else if (totalChanges > 200 || changedFiles > 8)
            autoLevel = "level:advanced";
          else if (totalChanges > 50 || changedFiles > 3)
            autoLevel = "level:intermediate";

          if (![...existingLabels].some((n) => n.startsWith("level:"))) {
            toAdd.push(autoLevel);
          }

          // Size Label
          let sizeLabel;
          if (totalChanges < 10) sizeLabel = "size/XS";
          else if (totalChanges < 50) sizeLabel = "size/S";
          else if (totalChanges < 150) sizeLabel = "size/M";
          else if (totalChanges < 500) sizeLabel = "size/L";
          else sizeLabel = "size/XL";

          if (![...existingLabels].some((n) => n.startsWith("size/"))) {
            toAdd.push(sizeLabel);
          }
        } else {
          // --- Issue Specific Labels ---
          if (![...existingLabels].some((n) => n.startsWith("level:"))) {
            toAdd.push("level:beginner");
          }
        }

        if (toAdd.length > 0) {
          console.log(`Adding labels to #${number}: ${toAdd.join(", ")}`);
          await octokit.rest.issues.addLabels({
            owner,
            repo,
            issue_number: number,
            labels: toAdd,
          });
        }

        // --- Rate Limit Handling ---
        const remaining = parseInt(
          headers["x-ratelimit-remaining"] || "5000",
          10
        );
        if (remaining < 50) {
          const resetTime =
            parseInt(headers["x-ratelimit-reset"] || "0", 10) * 1000;
          const waitTime = Math.max(resetTime - Date.now(), 0) + 5000;
          console.log(
            `Rate limit running low (${remaining} left). Sleeping for ${waitTime}ms...`
          );
          await delay(waitTime);
        } else {
          await delay(250);
        }
      }

      page++;
    } catch (error) {
      console.error(`Error on page ${page}: ${error.message}`);
      if (error.status === 403 && error.message.includes("rate limit")) {
        console.log("Hit rate limit unexpectedly. Sleeping for 2 minutes...");
        await delay(120000);
      } else {
        break;
      }
    }
  }

  console.log(
    `Finished processing. Checked ${prsProcessed} PRs and ${issuesProcessed} Issues.`
  );
}

run();
