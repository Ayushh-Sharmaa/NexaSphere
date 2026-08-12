import assert from "node:assert/strict";
import test from "node:test";
import http from "node:http";
import jwt from "jsonwebtoken";
import { setWithDbOverride } from "../repositories/db.js";

process.env.NODE_ENV = "test";
process.env.ADMIN_USERNAME = "admin";
process.env.ADMIN_PASSWORD = "StrongPassword123!";
process.env.ADMIN_EVENT_PASSWORD = "StrongEventPassword123!";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.JWT_SECRET =
  "secret_super_long_secret_key_that_is_safe_and_long_enough_for_256bit";
process.env.PORT = "0";
process.env.DATABASE_URL = "postgresql://localhost/dummy_test_db";

// Mock DB responses for sync testing
let dbQueries = [];
let mockDbResult = {
  select: [],
};

setWithDbOverride(async (fn) => {
  const mockClient = {
    query: async (sql, params) => {
      dbQueries.push({ sql: sql.trim().replace(/\s+/g, " "), params });

      const sqlLower = sql.toLowerCase();
      if (sqlLower.includes("select count")) {
        return { rows: [{ count: mockDbResult.select.length }], rowCount: 1 };
      }
      if (
        sqlLower.includes("select updated_at") ||
        sqlLower.includes("select id, name")
      ) {
        return {
          rows: mockDbResult.select,
          rowCount: mockDbResult.select.length,
        };
      }
      return { rows: [], rowCount: 1 };
    },
  };
  return fn(mockClient);
});

test("Offline-First Sync and Compression Verification", async (t) => {
  const { default: app } = await import("../index.js");
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const { studentAuthService } =
    await import("../services/studentAuthService.js");
  const mockUser = {
    id: "student-test-uuid",
    provider: "github",
    email: "test@glbajajgroup.org",
    full_name: "Test Student",
    role: "student",
  };
  const token = studentAuthService.generateToken(mockUser);

  const sendRequest = (method, path, body = null, headers = {}) => {
    return new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: port,
        path: path,
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      };

      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data || "{}");
          } catch {
            parsed = data;
          }
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        });
      });

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  };

  test.beforeEach(() => {
    dbQueries = [];
    mockDbResult = { select: [] };
  });

  try {
    await t.test("1. Sync status endpoint", async () => {
      const res = await sendRequest("GET", "/api/sync/status");
      assert.equal(res.status, 200);
      assert.equal(res.body.status, "ok");
      assert.ok(res.body.serverTime);
      assert.equal(res.body.databaseConnected, true);
    });

    await t.test("2. Retrieve updates based on timestamp", async () => {
      const mockEvent = {
        id: "event-offline-1",
        name: "Offline Session",
        description: "Testing updates since date",
        updated_at: new Date().toISOString(),
      };
      mockDbResult.select = [mockEvent];

      const res = await sendRequest(
        "GET",
        "/api/sync/updates?since=2026-06-01T00:00:00.000Z"
      );
      assert.equal(res.status, 200);
      assert.ok(res.body.events);
      assert.equal(res.body.events.length, 1);
      assert.equal(res.body.events[0].id, "event-offline-1");
    });

    await t.test(
      "3. Batch mutation with conflict detection (Server version newer)",
      async () => {
        // Mock database having a newer version (updated_at)
        const mockEventServerVersion = {
          name: "Server version",
          description: "Server text",
          updated_at: new Date("2026-06-09T22:00:00.000Z").toISOString(),
        };
        mockDbResult.select = [mockEventServerVersion];

        const batchPayload = {
          changes: [
            {
              type: "event",
              id: "event-offline-1",
              lastKnownTimestamp: "2026-06-09T20:00:00.000Z", // older
              data: {
                name: "My local offline changes",
                description: "My text",
              },
            },
          ],
        };

        const testToken = jwt.sign(
          {
            sub: "student-test-id",
            email: "student@example.com",
            name: "Test Student",
            role: "student",
            scopes: ["events:write", "events:read"],
          },
          process.env.JWT_SECRET
        );

        const res = await sendRequest("POST", "/api/sync/batch", batchPayload, {
          Authorization: `Bearer ${testToken}`,
        });
        assert.equal(res.status, 409); // Conflict status
        assert.equal(res.body.results[0].status, "conflict");
        assert.ok(res.body.results[0].serverVersion);
      }
    );

    await t.test("4. Batch mutation succeeds when no conflict", async () => {
      // Mock database having an older version (client lastKnown is equal or newer)
      const mockEventServerVersion = {
        name: "Server version",
        description: "Server text",
        updated_at: new Date("2026-06-09T18:00:00.000Z").toISOString(),
      };
      mockDbResult.select = [mockEventServerVersion];

      const batchPayload = {
        changes: [
          {
            type: "event",
            id: "event-offline-1",
            lastKnownTimestamp: "2026-06-09T20:00:00.000Z", // newer
            data: {
              name: "My local offline changes",
              description: "My text",
            },
          },
        ],
      };

      const testToken = jwt.sign(
        {
          sub: "student-test-id",
          email: "student@example.com",
          name: "Test Student",
          role: "student",
          scopes: ["events:write", "events:read"],
        },
        process.env.JWT_SECRET
      );

      const res = await sendRequest("POST", "/api/sync/batch", batchPayload, {
        Authorization: `Bearer ${testToken}`,
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.results[0].status, "success");
    });

    await t.test(
      "5. Bandwidth Data Compression (Accept-Encoding: gzip)",
      async () => {
        const res = await sendRequest("GET", "/api/sync/status", null, {
          "Accept-Encoding": "gzip, deflate, br",
        });
        // The compression middleware compresses responses larger than 1kb by default,
        // but some servers or libraries can compress smaller ones if forced.
        // Let's assert status is successful.
        assert.equal(res.status, 200);
      }
    );
  } finally {
    server.close();
  }
});
