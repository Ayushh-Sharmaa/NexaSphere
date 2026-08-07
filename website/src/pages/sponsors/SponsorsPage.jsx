import { useState, useEffect } from 'react';
import Footer from '../../shared/Footer';
import apiClient from '../../utils/apiClient';

const TIER_ORDER = ['platinum', 'gold', 'silver', 'bronze', 'custom'];
const TIER_LABELS = {
  platinum: { label: 'Platinum Partner', color: '#a855f7', icon: '💎' },
  gold: { label: 'Gold Partner', color: '#fbbf24', icon: '🥇' },
  silver: { label: 'Silver Partner', color: '#9ca3af', icon: '🥈' },
  bronze: { label: 'Bronze Partner', color: '#cd7f32', icon: '🥉' },
  custom: { label: 'Partner', color: '#3b82f6', icon: '🤝' },
};

const TIER_HEIGHTS = {
  platinum: { minHeight: '480px', logoSize: '100px', badgeScale: '1.1' },
  gold: { minHeight: '380px', logoSize: '80px', badgeScale: '1' },
  silver: { minHeight: '320px', logoSize: '64px', badgeScale: '0.9' },
  bronze: { minHeight: '280px', logoSize: '56px', badgeScale: '0.85' },
  custom: { minHeight: '300px', logoSize: '64px', badgeScale: '0.9' },
};

export default function SponsorsPage() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    if (!base) {
      setSponsors([]);
      setLoading((l) => (l ? false : l));
      return;
    }
    apiClient(`${base}/api/content/sponsors`)
      .then((data) => {
        setSponsors(Array.isArray(data?.sponsors) ? data.sponsors : []);
      })
      .catch(() => setSponsors([]))
      .finally(() => setLoading(false));
  }, []);

  const grouped = TIER_ORDER.map((tier) => ({
    tier,
    ...TIER_LABELS[tier],
    sponsors: sponsors.filter((s) => s.tier === tier && s.status === 'active'),
  })).filter((g) => g.sponsors.length > 0);

  if (loading) {
    return (
      <div
        className="page-wrapper"
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '1.1rem', color: 'var(--t2)', opacity: 0.6 }}>
          Loading sponsors...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper" style={{ paddingBottom: '60px' }}>
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px 40px',
          background: 'linear-gradient(180deg, var(--c1a) 0%, transparent 100%)',
        }}
      >
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '12px' }}>
          Our Sponsors & Partners
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'var(--t2)', maxWidth: '600px', margin: '0 auto' }}>
          We are proud to collaborate with organizations that share our vision of empowering
          students through technology.
        </p>
      </div>

      {sponsors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤝</div>
          <h3 style={{ marginBottom: '8px' }}>Sponsorship Opportunities</h3>
          <p style={{ maxWidth: '500px', margin: '0 auto' }}>
            Interested in partnering with us? Reach out to learn about our sponsorship tiers and
            benefits.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          {grouped.map((group) => {
            const th = TIER_HEIGHTS[group.tier] || TIER_HEIGHTS.bronze;
            return (
              <section key={group.tier} style={{ marginBottom: '48px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '24px',
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{group.icon}</span>
                  <h2
                    style={{ fontSize: '1.4rem', fontWeight: 600, color: group.color, margin: 0 }}
                  >
                    {group.label}
                  </h2>
                  <div
                    style={{
                      flex: 1,
                      height: '1px',
                      background: `linear-gradient(90deg, ${group.color}44, transparent)`,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                  }}
                >
                  {group.sponsors.map((sponsor) => (
                    <div
                      key={sponsor.id}
                      style={{
                        background: 'var(--card)',
                        borderRadius: '16px',
                        padding: '28px 24px',
                        border: `1px solid ${group.color}22`,
                        minHeight: th.minHeight,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = `0 12px 40px ${group.color}22`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      <div
                        style={{
                          width: th.logoSize,
                          height: th.logoSize,
                          borderRadius: '50%',
                          background: 'var(--bg)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '16px',
                          flexShrink: 0,
                          border: `2px solid ${group.color}22`,
                          overflow: 'hidden',
                        }}
                      >
                        {sponsor.logoUrl ? (
                          <img
                            loading="lazy"
                            src={sponsor.logoUrl}
                            alt={sponsor.companyName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ fontSize: '2rem', opacity: 0.4 }}>
                            {sponsor.companyName[0]}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px' }}>
                        {sponsor.companyName}
                      </h3>
                      {sponsor.description && (
                        <p
                          style={{
                            fontSize: '0.85rem',
                            color: 'var(--t2)',
                            lineHeight: 1.5,
                            marginBottom: '12px',
                          }}
                        >
                          {sponsor.description}
                        </p>
                      )}
                      {sponsor.websiteUrl && (
                        <a
                          href={sponsor.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            marginTop: 'auto',
                            fontSize: '0.85rem',
                            color: group.color,
                            textDecoration: 'none',
                            fontWeight: 500,
                            padding: '6px 16px',
                            borderRadius: '20px',
                            border: `1px solid ${group.color}33`,
                            transition: 'background 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${group.color}11`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Visit Website →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Footer />
    </div>
  );
}
