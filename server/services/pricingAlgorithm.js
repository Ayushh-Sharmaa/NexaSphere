/**
 * computeDynamicPrice — pure pricing algorithm (no DB dependencies)
 *
 * Extracted from dynamicPricingService.js so this function can be unit-tested
 * in environments without a Prisma client (e.g. CI without DB).
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
 * Loyalty discount: -10% for returning attendees (≥3 past events)
 *
 * Result is clamped to [minPrice, maxPrice].
 */

/**
 * @param {object} params
 * @param {number} params.basePrice
 * @param {number} params.minPrice
 * @param {number} params.maxPrice
 * @param {number} params.capacity       Total seats
 * @param {number} params.registrations  Filled seats
 * @param {Date|string} params.eventDate
 * @param {boolean} [params.isLoyal]
 * @param {Date}   [params.now]          Injection point for testing
 * @returns {{ price: number, reasons: string[] }}
 */
export function computeDynamicPrice({
  basePrice,
  minPrice,
  maxPrice,
  capacity,
  registrations,
  eventDate,
  isLoyal = false,
  now = new Date(),
}) {
  const reasons = [];
  let multiplier = 1;

  // ── Time-based tier ──────────────────────────────────────────────────────
  const daysUntil = (new Date(eventDate) - now) / (1000 * 60 * 60 * 24);

  if (daysUntil > 30) {
    multiplier *= 0.8;
    reasons.push('early_bird_-20pct');
  } else if (daysUntil < 3) {
    multiplier *= 1.5;
    reasons.push('final_days_+50pct');
  } else if (daysUntil < 15) {
    multiplier *= 1.2;
    reasons.push('last_minute_+20pct');
  } else {
    reasons.push('standard_rate');
  }

  // ── Demand-based adjustment ───────────────────────────────────────────────
  if (capacity > 0) {
    const utilization = registrations / capacity;

    if (utilization >= 0.95) {
      multiplier *= 1.25;
      reasons.push('demand_95pct_+25pct');
    } else if (utilization >= 0.8) {
      multiplier *= 1.1;
      reasons.push('demand_80pct_+10pct');
    } else if (utilization <= 0.2) {
      multiplier *= 0.85;
      reasons.push('low_demand_-15pct');
    }
  }

  // ── Loyalty-based discount ───────────────────────────────────────────────
  if (isLoyal) {
    multiplier *= 0.9;
    reasons.push('loyalty_discount_-10pct');
  }

  // ── Apply & clamp ─────────────────────────────────────────────────────────
  const raw = basePrice * multiplier;
  const safeMinPrice = typeof minPrice === 'number' ? Math.max(0, minPrice) : 0;
  const safeMaxPrice = typeof maxPrice === 'number' ? Math.max(safeMinPrice, maxPrice) : safeMinPrice;
  const calculatedPrice = Math.round(raw * 100) / 100;
  const price = Math.min(safeMaxPrice, Math.max(safeMinPrice, calculatedPrice));

  return { price, reasons };
}
