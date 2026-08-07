import { withDb } from './db.js';

export const eventPricingRepository = {
  async getTiersByEvent(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from event_price_tiers where event_id = $1 order by capacity_threshold_percent asc`,
        [eventId]
      );
      return rows;
    });
  },

  async setTiersForEvent(eventId, tiers) {
    return withDb(async (client) => {
      await client.query(`begin`);
      try {
        await client.query(`delete from event_price_tiers where event_id = $1`, [eventId]);

        const newTiers = [];
        for (const tier of tiers) {
          const { rows } = await client.query(
            `insert into event_price_tiers (event_id, name, price, capacity_threshold_percent)
             values ($1, $2, $3, $4) returning *`,
            [eventId, tier.name, tier.price, tier.capacityThresholdPercent]
          );
          newTiers.push(rows[0]);
        }

        await client.query(`commit`);
        return newTiers;
      } catch (e) {
        await client.query(`rollback`);
        throw e;
      }
    });
  },

  async getCurrentPrice(eventId) {
    return withDb(async (client) => {
      // Get capacity details from events table and registrations
      const { rows: eventRows } = await client.query(`select capacity from events where id = $1`, [
        eventId,
      ]);

      if (!eventRows.length) return null;
      const capacity = eventRows[0].capacity;

      const { rows: regRows } = await client.query(
        `select count(*) as count from registrations where event_id = $1`,
        [eventId]
      );
      const registeredCount = parseInt(regRows[0].count, 10);

      const { rows: tiers } = await client.query(
        `select * from event_price_tiers where event_id = $1 order by capacity_threshold_percent asc`,
        [eventId]
      );

      if (tiers.length === 0) return null;

      const currentCapacityPercent = capacity > 0 ? (registeredCount / capacity) * 100 : 0;

      let currentTier = tiers[0];
      let nextTier = tiers.length > 1 ? tiers[1] : null;

      for (let i = 0; i < tiers.length; i++) {
        if (currentCapacityPercent >= tiers[i].capacity_threshold_percent) {
          currentTier = tiers[i];
          nextTier = i + 1 < tiers.length ? tiers[i + 1] : null;
        } else {
          break;
        }
      }

      return {
        currentPrice: currentTier.price,
        currentTierName: currentTier.name,
        currentCapacityPercent,
        nextTier: nextTier
          ? {
              name: nextTier.name,
              price: nextTier.price,
              threshold: nextTier.capacity_threshold_percent,
            }
          : null,
      };
    });
  },
};
