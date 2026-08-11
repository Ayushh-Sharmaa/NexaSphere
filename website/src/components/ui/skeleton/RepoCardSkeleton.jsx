import React from 'react';
import { Skeleton } from './Skeleton';

export const RepoCardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={`repo-card-skeleton-${i}`}
          className="checklist-item"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '10px',
            pointerEvents: 'none',
          }}
          aria-busy="true"
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
            {/* Checkbox placeholder */}
            <Skeleton width="16px" height="16px" rounded={false} />

            {/* Repo name placeholder */}
            <Skeleton width="60%" height="1.2em" />

            {/* Star count placeholder */}
            <div style={{ marginLeft: 'auto' }}>
              <Skeleton width="40px" height="1em" />
            </div>
          </div>

          {/* Language placeholder */}
          <div style={{ marginTop: '8px', paddingLeft: '24px', width: '100%' }}>
            <Skeleton width="30%" height="0.8em" />
          </div>
        </div>
      ))}
    </>
  );
};
