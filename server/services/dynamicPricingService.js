/**
 * Dynamic Event Capacity Pricing — core algorithm
 *
 * Rules (from Issue #1756):
 *
 * Time-based tiers:
 *   > 30 days  → Early Bird:   -20%
 *   15-30 days → Standard:      0%
 *   3-15 days  → Last Minute: +20%
 *   < 3 days   → Final Days:  +50%
 *
 * Demand-based adjustments (applied on top of time tier):
 *   Capacity ≥ 95% → +25%
 *   Capacity ≥ 80% → +10%
 *   Capacity ≤ 20% → -15%
 *
 * Constraints:
 *   - Result is clamped to [minPrice, maxPrice]
 *   - Admin override bypasses the algorithm entirely
 *   - VIP/student tickets are always fixed (not handled here)
 */

import { PrismaClient } from '@prisma/client';
import { computeDynamicPrice } from './pricingAlgorithm.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Re-export so existing callers (controllers, tests) work unchanged
export { computeDynamicPrice };

// ── Pure algorithm (no DB calls — easy to unit-test) ─────────────────────────

/**
 * Compute the dynamic price for an event.
 *
 * @param {object} params
 * @param {number} params.basePrice
 * @param {number} params.minPrice
 * @param {number} params.maxPrice
 * @param {number} params.capacity       Total seats
 * @param {number} params.registrations  Filled seats
 * @param {Date}   params.eventDate
 * @param {Date}   [params.now]          Injection point for testing
 * @returns {{ price: number, reasons: string[] }}
 */

// ── Database-backed service ───────────────────────────────────────────────────
export const dynamicPricingService = {
  /**
   * Create or update pricing configuration for an event.
   */
  async upsertPricing(eventId, { basePrice, minPrice, maxPrice, capacity, eventDate }) {
    const { price, reasons } = computeDynamicPrice({
      basePrice,
      minPrice,
      maxPrice,
      capacity,
      registrations: 0,
      eventDate: new Date(eventDate),
    });
    const pricing = await prisma.eventPricing.upsert({
      where: { eventId },
      create: {
        eventId,
        basePrice,
        currentPrice: price,
        minPrice,
        maxPrice,
        capacity,
        eventDate: new Date(eventDate),
      },
      update: {
        basePrice,
        minPrice,
        maxPrice,
        capacity,
        eventDate: new Date(eventDate),
        currentPrice: price,
      },
    });

    await prisma.priceHistory.create({
      data: {
        pricingId: pricing.id,
        price,
        reason: reasons.join(','),
      },
    });

    return { pricing, reasons };
  },

  /**
   * Recalculate the current price for an event (called hourly or on demand).
   */
  async recalculatePrice(eventId) {
    const pricing = await prisma.eventPricing.findUnique({ where: { eventId } });
    if (!pricing) throw new Error(`No pricing config found for eventId: ${eventId}`);

    // Admin override takes priority
    if (pricing.adminOverride !== null && pricing.adminOverride !== undefined) {
      return {
        pricing,
        currentPrice: pricing.adminOverride,
        reasons: ['admin_override'],
      };
    }

    const { price, reasons } = computeDynamicPrice({
      basePrice: pricing.basePrice,
      minPrice: pricing.minPrice,
      maxPrice: pricing.maxPrice,
      capacity: pricing.capacity,
      registrations: pricing.registrations,
      eventDate: pricing.eventDate,
    });

    const updated = await prisma.eventPricing.update({
      where: { eventId },
      data: { currentPrice: price },
    });

    await prisma.priceHistory.create({
      data: {
        pricingId: pricing.id,
        price,
        reason: reasons.join(','),
      },
    });

    return { pricing: updated, currentPrice: price, reasons };
  },

  /**
   * Increment registration count (called when someone registers).
   */
  async incrementRegistrations(eventId) {
    const pricing = await prisma.eventPricing.findUnique({ where: { eventId } });
    if (!pricing) return null;

    const updated = await prisma.eventPricing.update({
      where: { eventId },
      data: { registrations: { increment: 1 } },
    });

    // Immediately recalculate after a registration
    return this.recalculatePrice(eventId);
  },

  /**
   * Admin override — pin a specific price.  Pass null to remove override.
   */
  async setAdminOverride(eventId, overridePrice) {
    const pricing = await prisma.eventPricing.update({
      where: { eventId },
      data: {
        adminOverride: overridePrice,
        currentPrice: overridePrice ?? (await this._computeAndGet(eventId)),
      },
    });

    if (overridePrice !== null) {
      await prisma.priceHistory.create({
        data: {
          pricingId: pricing.id,
          price: overridePrice,
          reason: 'admin_override',
        },
      });
    }

    return pricing;
  },

  /** Helper: compute price without persisting. */
  async _computeAndGet(eventId) {
    const pricing = await prisma.eventPricing.findUnique({ where: { eventId } });
    const { price } = computeDynamicPrice({ ...pricing });
    return price;
  },

  /** Get full pricing info + history for an event. */
  async getPricing(eventId) {
    return prisma.eventPricing.findUnique({
      where: { eventId },
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
  },

  async getPriceTransparency(eventId, email = null) {
    const pricing = await prisma.eventPricing.findUnique({
      where: { eventId },
      include: { priceHistory: { orderBy: { createdAt: 'desc' }, take: 2 } },
    });
    if (!pricing) return null;

    let isLoyal = false;
    if (email) {
      try {
        const result = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM event_registrations WHERE email = ${email}`;
        const count = result?.[0]?.count || 0;
        if (count >= 3) {
          isLoyal = true;
        }
      } catch (err) {
        logger.error('Error fetching loyalty count:', { error: err?.message });
      }
    }

    const previousPrice = pricing.priceHistory?.[1]?.price ?? pricing.basePrice;

    const { price: currentPrice, reasons } = computeDynamicPrice({
      basePrice: pricing.basePrice,
      minPrice: pricing.minPrice,
      maxPrice: pricing.maxPrice,
      capacity: pricing.capacity,
      registrations: pricing.registrations,
      eventDate: pricing.eventDate,
      isLoyal,
    });

    const { price: futurePrice } = computeDynamicPrice({
      basePrice: pricing.basePrice,
      minPrice: pricing.minPrice,
      maxPrice: pricing.maxPrice,
      capacity: pricing.capacity,
      registrations: pricing.registrations,
      eventDate: pricing.eventDate,
      isLoyal,
      now: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    });

    const combinedReasons = [...(pricing.priceHistory?.[0]?.reason?.split(',') ?? []), ...reasons];

    return {
      basePrice: pricing.basePrice,
      currentPrice,
      previousPrice,
      estimatedPriceIn7Days: futurePrice,
      priceChanged: currentPrice !== previousPrice,
      reasons: combinedReasons,
      capacityUtilization:
        pricing.capacity > 0 ? Math.round((pricing.registrations / pricing.capacity) * 100) : 0,
      isLoyal,
    };
  },

  /** Analytics: revenue attribution to dynamic pricing. */
  async getPricingAnalytics() {
    const pricings = await prisma.eventPricing.findMany({
      include: { priceHistory: true },
    });

    return pricings.map((p) => ({
      eventId: p.eventId,
      basePrice: p.basePrice,
      currentPrice: p.currentPrice,
      registrations: p.registrations,
      revenueEstimate: p.currentPrice * p.registrations,
      baselineRevenue: p.basePrice * p.registrations,
      revenueUplift: (p.currentPrice - p.basePrice) * p.registrations,
      capacityUtilization: p.capacity > 0 ? Math.round((p.registrations / p.capacity) * 100) : 0,
    }));
  },
};
