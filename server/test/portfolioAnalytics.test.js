import test from "node:test";
import assert from "node:assert";
import { portfolioAnalyticsService } from "../services/portfolioAnalyticsService.js";

test("Portfolio analytics exists", async () => {
  const data = await portfolioAnalyticsService.getAnalytics("john");
});
