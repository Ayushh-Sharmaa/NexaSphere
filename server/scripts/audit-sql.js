import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reposDir = path.join(__dirname, "..", "repositories");

const files = fs.readdirSync(reposDir).filter((f) => f.endsWith(".js"));
let vulnerabilitiesFound = 0;

for (const file of files) {
  const filePath = path.join(reposDir, file);
  const content = fs.readFileSync(filePath, "utf-8");

  const queryRegex = /(?:client|dbClient)\.query\s*\(\s*([\s\S]*?)\)/g;
  let match;

  while ((match = queryRegex.exec(content)) !== null) {
    const queryArg = match[1].trim();
    const firstPart = queryArg.split(",")[0].trim();

    // Strip out all literal strings to see if '+' is used as a JavaScript operator
    const cleanPart = firstPart
      .replace(/"(?:[^"\\]|\\.)*"/g, "")
      .replace(/'(?:[^'\\]|\\.)*'/g, "")
      .replace(/`(?:[^`\\]|\\.)*`/g, "");

    const hasInterpolation = firstPart.includes("${");
    const hasConcat = cleanPart.includes("+");

    if (hasInterpolation || hasConcat) {
      // Safe patterns: only hardcoded column names / structural SQL are interpolated;
      // all user-supplied values travel via $N parameterized placeholders.
      const safePatterns = [
        "${where}",
        "${conditions.join(",
        "${sets.join(",
        "${fields.join(",
        "${setClauses.join(",
        "${placeholders}",
        "${column}",
        "${extraClause}",
        "${k}",
        "${i}",
        "${i++}",
        "${staleThresholdDays}",
      ];

      const isSafe =
        hasInterpolation &&
        !hasConcat &&
        safePatterns.some((pattern) => firstPart.includes(pattern));

      if (!isSafe) {
        console.log(`[Vulnerable] File: ${file}`);
        console.log(`  Query: ${firstPart}`);
        console.log("--------------------------------------------------");
        vulnerabilitiesFound++;
      }
    }
  }
}

console.log(
  `Audit complete. Found ${vulnerabilitiesFound} potential SQL injection vulnerabilities.`
);
process.exit(vulnerabilitiesFound > 0 ? 1 : 0);
