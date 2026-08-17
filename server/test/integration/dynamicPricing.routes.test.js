/**
 * Integration tests for Dynamic Pricing Routes
 *
 * Tests the route definitions, request validation, response shapes,
 * and error handling for all dynamic pricing endpoints.
 *
 * These routes are defined in server/routes/dynamicPricing.js but are
 * NOT mounted in index.js (dead code). The test mounts them at /api/pricing
 * and mocks the dynamicPricingService to avoid real database calls.
 */
import { describe, it, before, mock } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import express from "express";

// ---------------------------------------------------------------------------
// Mock dynamicPricingService
//
// The controller (dynamicPricingController.js) imports dynamicPricingService
// from '../services/dynamicPricingService.js'. By calling mock.module BEFORE
// any import of the routes/controller chain, the service is replaced with
// this mock — no database access occurs. The mock is registered at the ESM
// loader level and takes effect when dynamic imports resolve.
// ---------------------------------------------------------------------------

mock.module("../../services/dynamicPricingService.js", {
  namedExports: {
    dynamicPricingService: {
      upsertPricing: async (eventId, data) => ({
        eventId,
        basePrice: data.basePrice,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        capacity: data.capacity,
        currentPrice: data.basePrice,
        adminOverride: null,
        registrations: 0,
      }),

      getPricing: async (eventId) => {
        if (eventId === "nonexistent") return null;
        return {
          eventId,
          basePrice: 100,
          minPrice: 50,
          maxPrice: 200,
          currentPrice: 80,
          registrations: 10,
        };
      },

      getPriceTransparency: async (eventId, _email) => {
        if (eventId === "nonexistent") return null;
        return {
          eventId,
          basePrice: 100,
          adjustments: [{ reason: "Early Bird", amount: -20 }],
          finalPrice: 80,
        };
      },

      recalculatePrice: async (eventId) => ({
        eventId,
        previousPrice: 100,
        newPrice: 80,
        reasons: ["Time-based adjustment"],
      }),

      setAdminOverride: async (eventId, overridePrice) => ({
        eventId,
        basePrice: 100,
        adminOverride: overridePrice ?? null,
        currentPrice: overridePrice ?? 100,
      }),

      getPricingAnalytics: async () => ({
        totalEvents: 5,
        averageDiscount: 15,
        revenueAttribution: { dynamicPricing: 5000, fixed: 10000 },
        mostUsedAdjustment: "Early Bird",
      }),
    },
  },
});

// ---------------------------------------------------------------------------
// Test App Factory
//
// Uses dynamic import so the mock.module registration above takes effect
// before the route/controller chain is loaded. Static ESM imports are
// hoisted and would resolve before mock.module runs; dynamic import defers
// resolution until createTestApp() is called inside the before() hook.
// ---------------------------------------------------------------------------

let app;

async function createTestApp() {
  const { default: pricingRouter } =
    await import("../../routes/dynamicPricing.js");

  const newApp = express();
  newApp.use(express.json());
  newApp.use("/api/pricing", pricingRouter);
  return newApp;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Dynamic Pricing Routes", () => {
  before(async () => {
    app = await createTestApp();
  });

  // ── GET /api/pricing/analytics/all ─────────────────────────────────────

  describe("GET /api/pricing/analytics/all", () => {
    it("returns 200 with analytics object", async () => {
      const res = await request(app).get("/api/pricing/analytics/all");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.analytics);
      assert.equal(res.body.analytics.totalEvents, 5);
      assert.equal(res.body.analytics.averageDiscount, 15);
      assert.deepEqual(res.body.analytics.revenueAttribution, {
        dynamicPricing: 5000,
        fixed: 10000,
      });
      assert.equal(res.body.analytics.mostUsedAdjustment, "Early Bird");
    });

    it("returns JSON content-type", async () => {
      const res = await request(app).get("/api/pricing/analytics/all");
      assert.equal(res.status, 200);
      assert.ok(res.headers["content-type"].includes("application/json"));
    });
  });

  // ── GET /api/pricing/:eventId ──────────────────────────────────────────

  describe("GET /api/pricing/:eventId", () => {
    it("returns 200 with pricing data for a valid event", async () => {
      const res = await request(app).get("/api/pricing/event-123");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.pricing);
      assert.equal(res.body.pricing.eventId, "event-123");
      assert.equal(res.body.pricing.basePrice, 100);
      assert.equal(res.body.pricing.minPrice, 50);
      assert.equal(res.body.pricing.maxPrice, 200);
      assert.equal(res.body.pricing.currentPrice, 80);
      assert.equal(res.body.pricing.registrations, 10);
    });

    it("returns 404 for a nonexistent event", async () => {
      const res = await request(app).get("/api/pricing/nonexistent");

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Pricing not found");
    });
  });

  // ── GET /api/pricing/transparency/:eventId ─────────────────────────────

  describe("GET /api/pricing/transparency/:eventId", () => {
    it("returns 200 with transparency data for a valid event", async () => {
      const res = await request(app).get("/api/pricing/transparency/event-123");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.transparency);
      assert.equal(res.body.transparency.eventId, "event-123");
      assert.equal(res.body.transparency.basePrice, 100);
      assert.deepEqual(res.body.transparency.adjustments, [
        { reason: "Early Bird", amount: -20 },
      ]);
      assert.equal(res.body.transparency.finalPrice, 80);
    });

    it("returns 404 for a nonexistent event", async () => {
      const res = await request(app).get(
        "/api/pricing/transparency/nonexistent"
      );

      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Pricing not found");
    });
  });

  // ── POST /api/pricing/config/:eventId ──────────────────────────────────

  describe("POST /api/pricing/config/:eventId", () => {
    const validConfig = {
      basePrice: 100,
      minPrice: 50,
      maxPrice: 200,
      capacity: 100,
      eventDate: "2026-12-31T23:59:59Z",
    };

    it("returns 200 with created pricing config when body is valid", async () => {
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(validConfig);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data);
      assert.equal(res.body.data.eventId, "event-456");
      assert.equal(res.body.data.basePrice, 100);
      assert.equal(res.body.data.minPrice, 50);
      assert.equal(res.body.data.maxPrice, 200);
      assert.equal(res.body.data.capacity, 100);
      assert.equal(res.body.data.currentPrice, 100);
    });

    it("returns 400 when basePrice is missing", async () => {
      const { basePrice: _, ...missingBase } = validConfig;
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(missingBase);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });

    it("returns 400 when minPrice is missing", async () => {
      const { minPrice: _, ...missingMin } = validConfig;
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(missingMin);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });

    it("returns 400 when maxPrice is missing", async () => {
      const { maxPrice: _, ...missingMax } = validConfig;
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(missingMax);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });

    it("returns 400 when capacity is missing", async () => {
      const { capacity: _, ...missingCap } = validConfig;
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(missingCap);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });

    it("returns 400 when eventDate is missing", async () => {
      const { eventDate: _, ...missingDate } = validConfig;
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send(missingDate);

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });

    it("returns 400 when body is empty", async () => {
      const res = await request(app)
        .post("/api/pricing/config/event-456")
        .send({});

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error, "Missing required fields");
    });
  });

  // ── POST /api/pricing/recalculate/:eventId ─────────────────────────────

  describe("POST /api/pricing/recalculate/:eventId", () => {
    it("returns 200 with recalculated price result", async () => {
      const res = await request(app).post("/api/pricing/recalculate/event-789");

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.result);
      assert.equal(res.body.result.eventId, "event-789");
      assert.equal(res.body.result.previousPrice, 100);
      assert.equal(res.body.result.newPrice, 80);
      assert.deepEqual(res.body.result.reasons, ["Time-based adjustment"]);
    });
  });

  // ── POST /api/pricing/override/:eventId ────────────────────────────────

  describe("POST /api/pricing/override/:eventId", () => {
    it("returns 200 with admin override set to a specific price", async () => {
      const res = await request(app)
        .post("/api/pricing/override/event-789")
        .send({ overridePrice: 75 });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.pricing);
      assert.equal(res.body.pricing.eventId, "event-789");
      assert.equal(res.body.pricing.basePrice, 100);
      assert.equal(res.body.pricing.adminOverride, 75);
      assert.equal(res.body.pricing.currentPrice, 75);
    });

    it("returns 200 with admin override cleared when overridePrice is null", async () => {
      const res = await request(app)
        .post("/api/pricing/override/event-789")
        .send({ overridePrice: null });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.pricing);
      assert.equal(res.body.pricing.adminOverride, null);
      assert.equal(res.body.pricing.currentPrice, 100);
    });

    it("returns 200 when overridePrice is omitted from body", async () => {
      const res = await request(app)
        .post("/api/pricing/override/event-789")
        .send({});

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.pricing);
      // When overridePrice is undefined, the service resolves it to null
      // so adminOverride is null and currentPrice falls back to basePrice.
      assert.equal(res.body.pricing.adminOverride, null);
      assert.equal(res.body.pricing.currentPrice, 100);
    });
  });

  // ── Error Handling ─────────────────────────────────────────────────────

  describe("Error handling", () => {
    it("returns 500 when dynamicPricingService throws", async () => {
      // Dynamically import the mocked service to override one method.
      // The mock.module above already replaced the real service; we just
      // need a reference to temporarily sabotage a single method.
      const { dynamicPricingService: svc } =
        await import("../../services/dynamicPricingService.js");
      const original = svc.getPricingAnalytics;
      svc.getPricingAnalytics = async () => {
        throw new Error("Simulated database failure");
      };

      try {
        const res = await request(app).get("/api/pricing/analytics/all");

        assert.equal(res.status, 500);
        assert.equal(res.body.success, false);
        assert.equal(res.body.error, "Internal server error");
      } finally {
        svc.getPricingAnalytics = original;
      }
    });

    // NOTE: /api/pricing/:eventId is a wildcard catch-all, so there's
    // no "unknown route" for GET — any path under /api/pricing/* will
    // match :eventId unless another more specific route matches first.
  });
});
