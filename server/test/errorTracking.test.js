import "./setupEnv.js";
import assert from "node:assert/strict";
import test from "node:test";
process.env.NODE_ENV = "test";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.ADMIN_EVENT_PASSWORD = "StrongEventPassword123!";

import {
  logError,
  getErrorStats,
  getRecentErrors,
  getEndpointErrors,
  getUserErrors,
  clearErrors,
  __errorTrackingServiceInternals,
} from "../services/errorTrackingService.js";
import logger from "../utils/logger.js";

test.beforeEach(() => {
  clearErrors();
  // Restore default buffer limit env variable
  process.env.ERROR_BUFFER_LIMIT = "1000";
});

test.afterEach(() => {
  clearErrors();
  delete process.env.ERROR_BUFFER_LIMIT;
});

test("storing 10 errors works correctly", async () => {
  for (let i = 0; i < 10; i++) {
    await logError(new Error(`Test error ${i}`), {
      status: 500,
      url: `/api/test-${i}`,
      method: "GET",
    });
  }

  const stats = getErrorStats();
  assert.strictEqual(stats.total, 10);
  assert.strictEqual(stats.lastHour, 10);
  assert.strictEqual(stats.last24Hours, 10);

  const recent = getRecentErrors(10);
  assert.strictEqual(recent.length, 10);
  // Should be in reverse chronological order
  assert.strictEqual(recent[0].message, "Test error 9");
  assert.strictEqual(recent[9].message, "Test error 0");
});

test("storing 100 errors works correctly", async () => {
  for (let i = 0; i < 100; i++) {
    await logError(new Error(`Test error ${i}`), {
      status: 400 + (i % 5),
      url: `/api/test-${i % 10}`,
      method: "POST",
    });
  }

  const stats = getErrorStats();
  assert.strictEqual(stats.total, 100);

  const recent = getRecentErrors(100);
  assert.strictEqual(recent.length, 100);
});

test("configurable buffer limits via env works", async () => {
  process.env.ERROR_BUFFER_LIMIT = "50";

  for (let i = 0; i < 100; i++) {
    await logError(new Error(`Error ${i}`), {
      status: 500,
      url: "/api/endpoint",
      method: "GET",
    });
  }

  const stats = getErrorStats();
  // Buffer should be capped at 50, not 100
  assert.strictEqual(stats.total, 50);

  const recent = getRecentErrors(100);
  assert.strictEqual(recent.length, 50);

  // Verifying FIFO eviction: first 50 (0-49) must be evicted, last 50 (50-99) retained
  assert.strictEqual(recent[0].message, "Error 99");
  assert.strictEqual(recent[49].message, "Error 50");
});

test("handles invalid env limits gracefully", async () => {
  process.env.ERROR_BUFFER_LIMIT = "invalid";

  for (let i = 0; i < 1050; i++) {
    await logError(new Error(`Error ${i}`), {
      status: 500,
      url: "/api/endpoint",
      method: "GET",
    });
  }

  const stats = getErrorStats();
  // Should fallback to default limit of 1000
  assert.strictEqual(stats.total, 1000);
});

test("dynamic stats percentage calculations are correct", async () => {
  process.env.ERROR_BUFFER_LIMIT = "10";

  // Log 5 status 500, 5 status 400
  for (let i = 0; i < 5; i++) {
    await logError(new Error("500 Error"), {
      status: 500,
      url: "/a",
      method: "GET",
    });
    await logError(new Error("400 Error"), {
      status: 400,
      url: "/b",
      method: "GET",
    });
  }

  const stats = getErrorStats();
  assert.strictEqual(stats.total, 10);

  const status500 = stats.errorsByStatus.find((s) => s.status === 500);
  const status400 = stats.errorsByStatus.find((s) => s.status === 400);
  assert.strictEqual(status500.count, 5);
  assert.strictEqual(status500.percentage, "50.00");

  assert.strictEqual(status400.count, 5);
  assert.strictEqual(status400.percentage, "50.00");
});

test("stress testing: 10,000 errors inserted does not exceed limit and oldest are evicted", async () => {
  process.env.ERROR_BUFFER_LIMIT = "100";

  const startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    await logError(new Error(`Stress error ${i}`), {
      status: 500,
      url: `/api/stress-${i}`,
      method: "GET",
    });
  }
  const endTime = Date.now();
  console.log(
    `Log performance: 10,000 errors logged in ${endTime - startTime}ms`
  );

  const stats = getErrorStats();
  // Capped at exactly 100
  assert.strictEqual(stats.total, 100);

  const recent = getRecentErrors(200);
  assert.strictEqual(recent.length, 100);

  // Newest 100 retained (9900 - 9999)
  assert.strictEqual(recent[0].message, "Stress error 9999");
  assert.strictEqual(recent[99].message, "Stress error 9900");
});

test("retrieval methods (recent, endpoint, user) work correctly", async () => {
  await logError(new Error("User error"), {
    status: 500,
    url: "/api/endpoint-a",
    method: "GET",
    userId: "usr-1",
  });

  await logError(new Error("Other error"), {
    status: 500,
    url: "/api/endpoint-b",
    method: "POST",
    userId: "usr-2",
  });

  const endpointErrors = getEndpointErrors("/api/endpoint-a", 10);
  assert.strictEqual(endpointErrors.length, 1);
  assert.strictEqual(endpointErrors[0].message, "User error");

  const userErrors = getUserErrors("usr-1", 10);
  assert.strictEqual(userErrors.length, 1);
  assert.strictEqual(userErrors[0].message, "User error");
});

test("logError stores environment metadata and groups similar errors", async () => {
  await logError(new Error("Grouped error"), {
    status: 503,
    url: "/api/grouped",
    method: "POST",
  });
  await logError(new Error("Grouped error"), {
    status: 503,
    url: "/api/grouped",
    method: "POST",
  });

  const recent = getRecentErrors(2);
  assert.strictEqual(recent[0].environment.nodeVersion, process.version);
  assert.strictEqual(recent[0].environment.platform, process.platform);
  assert.ok(recent[0].fingerprint);
  assert.strictEqual(recent[0].fingerprint, recent[1].fingerprint);

  const stats = getErrorStats();
  assert.ok(Array.isArray(stats.groupedErrors));
  assert.strictEqual(stats.groupedErrors[0].message, "Grouped error");
  assert.strictEqual(stats.groupedErrors[0].count, 2);
});

// Silence logging during tests to keep console output clean
logger.error = () => {};
logger.info = () => {};

test("error tracking service caps the errorsByEndpoint map to 1000 items to prevent OOM", async () => {
  clearErrors();

  const { errorStore } = __errorTrackingServiceInternals;

  // Log errors for 1050 unique endpoints
  for (let i = 0; i < 1050; i++) {
    const error = new Error(`Fuzz error ${i}`);
    await logError(error, {
      method: "GET",
      url: `/api/fuzz-${i}`,
      status: 404,
    });
  }

  // The size of errorsByEndpoint should be capped at 1000
  const uniqueEndpointsCount = Object.keys(errorStore.errorsByEndpoint).length;
  assert.equal(
    uniqueEndpointsCount,
    1000,
    "Unique endpoints count should be capped at 1000"
  );

  // Verify that active/frequent endpoints are preserved
  // If we log the same endpoint multiple times, its count increases
  const frequentEndpoint = "/api/frequent";
  for (let i = 0; i < 5; i++) {
    await logError(new Error("Frequent error"), {
      method: "POST",
      url: frequentEndpoint,
      status: 500,
    });
  }

  // The frequent endpoint should exist in errorsByEndpoint and have a count of 5
  assert.equal(errorStore.errorsByEndpoint[`POST ${frequentEndpoint}`], 5);

  // The size should still be exactly 1000
  const postUniqueCount = Object.keys(errorStore.errorsByEndpoint).length;
  assert.equal(postUniqueCount, 1000);
});
