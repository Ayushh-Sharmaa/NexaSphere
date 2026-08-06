import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function EventPricingCard({ eventId, onRegister }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTransparency() {
      if (!eventId) return;
      try {
        const res = await fetch(`${API_BASE}/api/pricing/transparency/${eventId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPricing(data.transparency);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTransparency();
  }, [eventId]);

  if (loading)
    return <div className="p-4 border rounded shadow-sm animate-pulse bg-gray-50 h-32" />;
  if (error || !pricing) return null; // Don't show pricing block if dynamic pricing isn't configured

  const {
    currentPrice,
    basePrice,
    priceChanged,
    estimatedPriceIn7Days,
    reasons,
    capacityUtilization,

    isLoyal,
  } = pricing;

  // Format reasons for users
  const friendlyReasons = reasons
    .map((r) => {
      if (r.includes('early_bird')) return 'Early Bird Discount Applied!';
      if (r.includes('last_minute')) return 'Last Minute Demand Premium';
      if (r.includes('final_days')) return 'Final Days Premium';
      if (r.includes('demand_95')) return 'High Demand (Almost Sold Out!)';
      if (r.includes('demand_80')) return 'High Demand';
      if (r.includes('low_demand')) return 'Special Offer';
      return null;
    })
    .filter(Boolean);

  return (
    <div className="p-5 border border-indigo-100 rounded-xl bg-white shadow-sm font-sans">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wider mb-1">
            Registration Fee
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">₹{currentPrice}</span>
            {priceChanged && (
              <span className="text-sm text-gray-400 line-through">₹{basePrice}</span>
            )}
          </div>
        </div>

        {capacityUtilization > 0 && (
          <div className="text-right">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-md ${capacityUtilization > 85 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {capacityUtilization}% Full
            </span>
          </div>
        )}
      </div>

      {friendlyReasons.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {friendlyReasons.map((reason, idx) => (
            <span
              key={reason}
              className="inline-block bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md font-medium border border-indigo-100"
            >
              {reason}
            </span>
          ))}

          {isLoyal && (
            <span className="inline-block bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-md font-medium border border-emerald-100">
              🎁 Loyalty Discount Applied!
            </span>
          )}
        </div>
      )}

      {estimatedPriceIn7Days > currentPrice && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 p-2 rounded flex items-center gap-2 border border-amber-100">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clipRule="evenodd"
            />
          </svg>
          Prices may increase to ₹{estimatedPriceIn7Days} within the next 7 days based on current
          demand.
        </div>
      )}

      <button
        onClick={() => onRegister?.(eventId, currentPrice)}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
      >
        Register Now
      </button>
    </div>
  );
}
