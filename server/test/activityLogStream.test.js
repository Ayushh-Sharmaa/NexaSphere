import assert from "assert";

function filterAndTruncateLogs(logs, severityFilter, maxLogs = 100) {
  let filtered = logs;
  if (severityFilter !== "ALL") {
    filtered = logs.filter((l) => l.severity === severityFilter);
  }
  return filtered.slice(0, maxLogs);
}

function runTests() {
  console.log("Running Activity Log Stream Unit Tests...");

  const sampleLogs = [
    { id: 1, severity: "INFO", message: "User logged in", timestamp: "12:00:00" },
    { id: 2, severity: "WARN", message: "High CPU usage", timestamp: "12:00:05" },
    { id: 3, severity: "ERROR", message: "Database timeout", timestamp: "12:00:10" },
    { id: 4, severity: "INFO", message: "Metrics refreshed", timestamp: "12:00:15" },
  ];

  // Test 1: ALL filter
  const allLogs = filterAndTruncateLogs(sampleLogs, "ALL");
  assert.strictEqual(allLogs.length, 4);

  // Test 2: ERROR filter
  const errorLogs = filterAndTruncateLogs(sampleLogs, "ERROR");
  assert.strictEqual(errorLogs.length, 1);
  assert.strictEqual(errorLogs[0].id, 3);

  // Test 3: Truncation limit
  const truncated = filterAndTruncateLogs(sampleLogs, "ALL", 2);
  assert.strictEqual(truncated.length, 2);

  console.log("All Activity Log Stream tests passed successfully!");
}

runTests();
