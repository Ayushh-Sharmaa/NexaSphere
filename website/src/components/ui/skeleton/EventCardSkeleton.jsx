/**
 * EventCardSkeleton
 * Placeholder skeleton for event timeline cards while data loads.
 */
export function EventCardSkeleton({ count = 4 }) {
  return (
    <div role="status" aria-label="Loading events..." aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`skeleton-event-${i}`}
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '32px',
            alignItems: 'flex-start',
          }}
        >
          {/* Timeline dot */}
          <div
            className="skeleton-pulse"
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              flexShrink: 0,
              marginTop: '6px',
              background: 'var(--skeleton-base, rgba(255,255,255,0.06))',
            }}
          />
          {/* Card */}
          <div
            style={{
              flex: 1,
              padding: '20px',
              borderRadius: 'var(--r2, 14px)',
              border: '1px solid var(--bdr, rgba(255,255,255,0.08))',
              background: 'var(--card, rgba(255,255,255,0.02))',
            }}
          >
            {/* Title */}
            <div
              className="skeleton-pulse"
              style={{
                height: '18px',
                width: `${60 + (i % 3) * 15}%`,
                borderRadius: '4px',
                marginBottom: '12px',
                background: 'var(--skeleton-base, rgba(255,255,255,0.06))',
              }}
            />
            {/* Date */}
            <div
              className="skeleton-pulse"
              style={{
                height: '12px',
                width: '30%',
                borderRadius: '4px',
                marginBottom: '14px',
                background: 'var(--skeleton-base, rgba(255,255,255,0.06))',
              }}
            />
            {/* Description lines */}
            {[85, 75, 55].map((w, li) => (
              <div
                key={li}
                className="skeleton-pulse"
                style={{
                  height: '11px',
                  width: `${w}%`,
                  borderRadius: '4px',
                  marginBottom: '8px',
                  background: 'var(--skeleton-base, rgba(255,255,255,0.06))',
                  animationDelay: `${li * 0.12}s`,
                }}
              />
            ))}
            {/* Badge */}
            <div
              className="skeleton-pulse"
              style={{
                height: '20px',
                width: '80px',
                borderRadius: '20px',
                marginTop: '12px',
                background: 'var(--skeleton-base, rgba(255,255,255,0.06))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventCardSkeleton;
