import { eventPricingRepository } from '../repositories/eventPricingRepository.js';

export const getTiers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const tiers = await eventPricingRepository.getTiersByEvent(eventId);
    return res.json(tiers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const setTiers = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { tiers } = req.body;

    if (!Array.isArray(tiers)) {
      return res.status(400).json({ error: 'tiers must be an array' });
    }

    // Ensure tiers don't decrease in price as capacity increases (prevent price decrease mid-event)
    const sortedTiers = [...tiers].sort(
      (a, b) => a.capacityThresholdPercent - b.capacityThresholdPercent
    );
    for (let i = 1; i < sortedTiers.length; i++) {
      if (parseFloat(sortedTiers[i].price) < parseFloat(sortedTiers[i - 1].price)) {
        return res
          .status(400)
          .json({ error: 'Price cannot decrease at higher capacity thresholds' });
      }
    }

    const savedTiers = await eventPricingRepository.setTiersForEvent(eventId, sortedTiers);

    if (req.adminSession) {
      req.auditLog = {
        action: 'event_pricing.set_tiers',
        targetId: eventId,
        targetType: 'EventPricing',
        details: { tiers: sortedTiers },
      };
    }

    return res.json(savedTiers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getCurrentPrice = async (req, res) => {
  try {
    const { eventId } = req.params;
    const pricing = await eventPricingRepository.getCurrentPrice(eventId);
    if (!pricing) {
      return res
        .status(404)
        .json({ error: 'Pricing not configured for this event or event not found' });
    }
    return res.json(pricing);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
