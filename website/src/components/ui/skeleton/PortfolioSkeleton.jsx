import React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';

export const PortfolioSkeleton = () => {
  return (
    <div className="portfolio-presentation-container" style={{ padding: '24px' }}>
      <div className="portfolio-shell" aria-busy="true" aria-hidden="true">
        {/* Intro Profile Summary */}
        <header
          className="portfolio-intro"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          <SkeletonAvatar size={120} />
          <div
            className="portfolio-bio-col"
            style={{
              width: '100%',
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Skeleton width="40%" height="2.5rem" />
            <Skeleton width="60%" height="1.5rem" />
            <SkeletonText lines={3} width="100%" gap="8px" style={{ marginTop: '16px' }} />

            {/* Social Links Skeleton */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <Skeleton width="40px" height="40px" rounded />
              <Skeleton width="40px" height="40px" rounded />
              <Skeleton width="40px" height="40px" rounded />
            </div>
          </div>
        </header>

        <main
          className="portfolio-grid"
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
        >
          {/* Section A: Skills */}
          <section className="portfolio-panel">
            <Skeleton width="200px" height="2rem" style={{ marginBottom: '20px' }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {/* Stable widths — avoid Math.random() in render which causes
                  layout instability and breaks React hydration */}
              {[96, 120, 88, 112, 100, 136].map((w, i) => (
                <Skeleton
                  key={`portfolio-skill-${i}`}
                  width={`${w}px`}
                  height="32px"
                  style={{ borderRadius: '16px' }}
                />
              ))}
            </div>
          </section>

          {/* Section B: Projects */}
          <section className="portfolio-panel">
            <Skeleton width="250px" height="2rem" style={{ marginBottom: '20px' }} />
            <div
              className="portfolio-projects-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '24px',
              }}
            >
              {Array.from({ length: 4 }).map((_, i) => (
                <article
                  key={`portfolio-project-${i}`}
                  className="portfolio-project-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    border: '1px solid var(--bdr2, rgba(255,255,255,0.05))',
                    borderRadius: '12px',
                    padding: '16px',
                  }}
                >
                  <Skeleton width="100%" height="160px" style={{ borderRadius: '8px' }} />
                  <Skeleton width="80%" height="1.5rem" />
                  <SkeletonText lines={2} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <Skeleton width="32px" height="32px" rounded />
                    <Skeleton width="32px" height="32px" rounded />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
