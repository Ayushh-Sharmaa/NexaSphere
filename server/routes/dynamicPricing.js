import express from "express";
import {
  upsertPricing,
  getPricing,
  getPriceTransparency,
  recalculatePrice,
  setAdminOverride,
  getAnalytics,
} from "../controllers/dynamicPricingController.js";

const router = express.Router();

router.get("/:eventId", getPricing);
router.get("/transparency/:eventId", getPriceTransparency);
router.post("/config/:eventId", upsertPricing);
router.post("/recalculate/:eventId", recalculatePrice);
router.post("/override/:eventId", setAdminOverride);
router.get("/analytics/all", getAnalytics);

export default router;
