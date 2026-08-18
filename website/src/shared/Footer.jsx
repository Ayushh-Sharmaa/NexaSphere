import { useNavigate } from 'react-router-dom';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON, GL_BAJAJ_LOGO } from './brandAssets';
import { Mail, Heart, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const NEXASPHERE_EMAIL = 'nexasphere@glbajajgroup.org';

/* ENV-configurable admin dashboard URL (defaults to same-host /admin) */
const ADMIN_URL = import.meta.env.VITE_ADMIN_DASHBOARD_URL || '/admin';

const FOOTER_LINKS = [
  { label: 'Activities', path: '/activities' },
  { label: 'Events', path: '/events' },
  { label: 'Roadmaps', path: '/roadmaps' },
  { label: 'About', path: '/about' },
  { label: 'Team', path: '/team' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Admin', path: '/admin' },
  { label: 'GitHub', path: 'https://github.com/Ayushh-Sharmaa/NexaSphere' },
];

const LEGAL_LINKS = [
  { label: 'Join', path: '/join' },
  { label: 'Apply', path: '/apply' },
  { label: 'Contact', path: '/contact' },
  { label: 'Accessibility', path: '/accessibility' },
];

export default function Footer({ onAdmin }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getLinkLabel = (label) => {
    let key = label.toLowerCase().replace(/\s+/g, '_');
    if (key === 'team') key = 'team';
    const translated = t(`nav.${key}`);
    return translated && !translated.startsWith('nav.') ? translated : label;
  };

  const go = (path) => {
    if (path === '/admin') {
      openAdmin();
    } else if (path.startsWith('http')) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openAdmin = () => {
    if (onAdmin) {
      onAdmin();
    } else if (ADMIN_URL.startsWith('http')) {
      window.open(ADMIN_URL, '_blank', 'noopener,noreferrer');
    } else {
      navigate(ADMIN_URL);
    }
  };

  return (
    <footer className="ns-footer">
      <div className="container">
        <div className="ns-footer-inner">
          <div className="ns-footer-divider" />

          {/* Brand row */}
          <div className="ns-footer-logos">
            <img
              src={BRAND_LOGO_ICON}
              alt="NexaSphere"
              className="ns-footer-logo-ns ns-footer-logo-mobile"
              loading="lazy"
            />
            <img
              src={BRAND_LOGO_FULL}
              alt="NexaSphere"
              className="ns-footer-logo-full ns-footer-logo-desktop"
              loading="lazy"
            />
            <div style={{ width: 1, height: 24, background: 'var(--bdr2)' }} />
            <img src={GL_BAJAJ_LOGO} alt="GL Bajaj" className="ns-footer-logo-gl" loading="lazy" />
          </div>

          {/* Nav links grid */}
          <nav
            aria-label="Footer navigation"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px 20px',
              justifyContent: 'center',
              margin: '18px 0 12px',
            }}
          >
            {FOOTER_LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--t1)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  padding: '2px 0',
                  transition: 'color 0.2s',
                  opacity: 0.92,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
              >
                {getLinkLabel(label)}
              </button>
            ))}
            {LEGAL_LINKS.map(({ label, path }) => (
              <button
                key={path}
                onClick={() => go(path)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--t1)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  letterSpacing: '0.04em',
                  padding: '2px 0',
                  transition: 'color 0.2s',
                  opacity: 0.92,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--c1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
              >
                {getLinkLabel(label)}
              </button>
            ))}
          </nav>

          <p className="ns-footer-text">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <p className="ns-footer-text">
            <Mail size={14} style={{ display: 'inline', verticalAlign: '-2px' }} />{' '}
            <a href={`mailto:${NEXASPHERE_EMAIL}`} className="ns-footer-email-link">
              {NEXASPHERE_EMAIL}
            </a>
          </p>
          <p className="ns-footer-text ns-footer-built">
            {t('footer.built_with') || 'Built with'}{' '}
            <Heart
              size={12}
              fill="currentColor"
              style={{ display: 'inline', verticalAlign: '-1px' }}
            />{' '}
            {t('footer.by_team') || 'by the NexaSphere Core Team'}
          </p>
        </div>
      </div>
    </footer>
  );
}
