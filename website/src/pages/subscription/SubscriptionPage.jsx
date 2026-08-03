import { useState, useEffect, useRef } from 'react';
import { useStudentAuth } from '../../context/StudentAuthContext';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'mo',
    color: '#888',
    features: ['Attend public events', 'Basic portfolio', 'View leaderboards', '100MB storage'],
    cta: 'Current Plan',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 4.99,
    currency: 'mo',
    color: '#CC1111',
    features: [
      'Priority registration (24h early)',
      'Exclusive premium events',
      'Advanced portfolio (custom CSS)',
      'Unlimited storage',
      'Badge showcase',
      'Ad-free experience',
      '7-day free trial',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    currency: 'mo',
    color: '#eab308',
    features: [
      'Everything in Premium',
      'Networking priority',
      'Skill exchange premium',
      'Priority support',
      'Certificate hosting (custom domain)',
      'Advanced analytics',
    ],
    cta: 'Go Pro',
    popular: false,
  },
];

export default function SubscriptionPage({ onBack }) {
  const { user, isAuthenticated } = useStudentAuth();
  const [currentTier, setCurrentTier] = useState('free');
  const [billingHistory] = useState([]);
  const [referralCode, setReferralCode] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const subscribeDelayRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (subscribeDelayRef.current) {
        clearTimeout(subscribeDelayRef.current);
      }
    };
  }, []);

  const handleSubscribe = async (tierId) => {
    if (tierId === 'free') return;
    if (!isAuthenticated) {
      alert('Please log in to subscribe');
      return;
    }
    setLoading(true);
    if (subscribeDelayRef.current) {
      clearTimeout(subscribeDelayRef.current);
    }
    await new Promise((resolve) => {
      subscribeDelayRef.current = setTimeout(resolve, 1000);
    });
    subscribeDelayRef.current = null;
    if (!isMountedRef.current) return;
    setCurrentTier(tierId);
    setLastInvoice({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      amount: tierId === 'premium' ? 4.99 : 9.99,
      status: 'paid',
      description: `NexaSphere ${TIERS.find((t) => t.id === tierId).name} - Monthly`,
    });
    setShowInvoice(true);
    setLoading(false);
  };

  const handleCancel = () => {
    if (
      confirm(
        'Cancel your subscription? You will retain access until the end of the billing period.'
      )
    ) {
      setCurrentTier('free');
    }
  };

  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' },
    header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' },
    backBtn: {
      background: 'none',
      border: '1px solid var(--border)',
      color: 'var(--t1)',
      borderRadius: '6px',
      padding: '6px 12px',
      cursor: 'pointer',
      fontSize: '0.85rem',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px',
    },
    card: (popular, color) => ({
      background: 'var(--bg-card, rgba(255,255,255,0.04))',
      borderRadius: '12px',
      padding: '28px 24px',
      border: popular ? `2px solid ${color}` : '1px solid var(--border)',
      position: 'relative',
      textAlign: 'center',
    }),
    badge: {
      position: 'absolute',
      top: '-12px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#CC1111',
      color: '#fff',
      padding: '4px 16px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
    },
    price: { fontSize: '2.5rem', fontWeight: 700, margin: '16px 0' },
    featureList: { listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left' },
    featureItem: {
      padding: '6px 0',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    btn: (primary, color) => ({
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '1rem',
      background: primary ? color || '#CC1111' : 'none',
      color: primary ? '#fff' : 'var(--t1)',
      border: primary ? 'none' : '1px solid var(--border)',
      transition: 'all 0.2s',
    }),
    section: { marginBottom: '32px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 600, marginBottom: '16px' },
    invoice: {
      background: 'var(--bg-card)',
      borderRadius: '10px',
      padding: '16px',
      border: '1px solid var(--border)',
      marginTop: '12px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        {onBack && (
          <button style={styles.backBtn} onClick={onBack}>
            ← Back
          </button>
        )}
        <h1 style={{ margin: 0 }}>Subscription</h1>
      </div>

      {currentTier !== 'free' && (
        <div style={{ ...styles.invoice, borderLeft: '4px solid #22c55e', marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <span style={{ fontWeight: 600 }}>
                {TIERS.find((t) => t.id === currentTier)?.name} Plan
              </span>
              <span className="badge badge-success" style={{ marginLeft: '8px' }}>
                Active
              </span>
            </div>
            <button
              onClick={handleCancel}
              style={{
                ...styles.btn(false),
                width: 'auto',
                padding: '6px 16px',
                fontSize: '0.85rem',
              }}
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      <div style={styles.grid}>
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.id;
          return (
            <div key={tier.id} style={styles.card(tier.popular, tier.color)}>
              {tier.popular && <div style={styles.badge}>Most Popular</div>}
              <h2 style={{ fontSize: '1.3rem', margin: 0 }}>{tier.name}</h2>
              <div style={styles.price}>
                {tier.price === 0 ? 'Free' : `$${tier.price}`}
                {tier.price > 0 && (
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--t2)' }}>
                    /{tier.currency}
                  </span>
                )}
              </div>
              <ul style={styles.featureList}>
                {tier.features.map((f) => (
                  <li key={f} style={styles.featureItem}>
                    <span style={{ color: '#22c55e' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                style={styles.btn(!isCurrent, tier.color)}
                disabled={isCurrent || loading}
                onClick={() => handleSubscribe(tier.id)}
              >
                {loading ? 'Processing…' : isCurrent ? 'Current Plan' : tier.cta}
              </button>
            </div>
          );
        })}
      </div>

      {showInvoice && lastInvoice && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Latest Invoice</h3>
          <div style={styles.invoice}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: 'var(--t2)' }}>Invoice #{lastInvoice.id}</span>
              <span style={{ color: 'var(--t2)' }}>{lastInvoice.date}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>{lastInvoice.description}</span>
              <span style={{ fontWeight: 600 }}>${lastInvoice.amount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--t2)' }}>Status</span>
              <span style={{ color: '#22c55e', fontWeight: 500 }}>✓ {lastInvoice.status}</span>
            </div>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Billing History</h3>
        {billingHistory.length === 0 ? (
          <p style={{ color: 'var(--t2)' }}>No billing history yet.</p>
        ) : (
          billingHistory.map((inv) => (
            <div key={inv.id} style={styles.invoice}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{inv.description}</span>
                <span>${inv.amount.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {currentTier !== 'free' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Referral Program</h3>
          <div style={styles.invoice}>
            <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--t2)' }}>
              Share your referral link — friends get 30% off their first month, you earn credit!
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--t1)',
                }}
                value={referralCode}
                readOnly
                placeholder="Subscribe to generate referral code"
              />
              <button
                style={{
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#CC1111',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
                onClick={() => {
                  const code = `NEXA-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                  setReferralCode(code);
                  navigator.clipboard?.writeText(code);
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
