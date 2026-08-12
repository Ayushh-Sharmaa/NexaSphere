import React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';

export const DashboardCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`dashboard-card-skeleton-${i}`}
          style={{
            background: 'var(--bg-card, rgba(255, 255, 255, 0.03))',
            border: '1px solid var(--bdr, rgba(255, 255, 255, 0.05))',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            marginBottom: '16px',
            pointerEvents: 'none',
          }}
          aria-busy="true"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SkeletonAvatar size={48} />
            <div style={{ flex: 1 }}>
              <Skeleton width="60%" height="1.2em" style={{ marginBottom: '8px' }} />
              <Skeleton width="40%" height="0.9em" />
            </div>
          </div>

          <SkeletonText lines={3} gap="8px" />

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <Skeleton width="80px" height="32px" rounded={false} style={{ borderRadius: '6px' }} />
            <Skeleton width="80px" height="32px" rounded={false} style={{ borderRadius: '6px' }} />
          </div>
        </div>
      ))}
    </>
  );
};
