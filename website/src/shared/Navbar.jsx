import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON } from './brandAssets';
import { ThemeToggle } from '../components/common/ThemeToggle';

const TABS = [
  'Home',
  'Activities',
  'Events',
  'Roadmaps',
  'Resources',
  'Forum',
  'About',
  'Core Team',
  'Contact',
];

export default function Navbar({ activeTab, onTabChange }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 1200 : false
  );
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => {
      const isCompact = window.innerWidth <= 1200;
      setCompact(isCompact);
      if (!isCompact) setMenuOpen(false);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('resize', r, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    if (menuOpen && compact) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('scroll', s);
      window.removeEventListener('resize', r);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [compact, menuOpen]);

  const handleTab = (tab) => {
    setMenuOpen(false);
    if (onTabChange) onTabChange(tab);
  };

  const goHome = () => {
    setMenuOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (compact) {
    return (
      <nav className="ns-navbar-mobile" aria-label="Mobile Navigation">
        <div
          className="ns-mobile-top"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0 16px',
          }}
        >
          <div
            onClick={goHome}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            aria-label="Go to homepage"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goHome()}
          >
            <img
              src={BRAND_LOGO_ICON}
              alt="NexaSphere"
              className="ns-mobile-logo-ns"
              loading="lazy"
              width="28"
              height="28"
            />
            <span className="ns-mobile-brand">
              <span>NexaSphere</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <button
              className={`ns-nav-menu-toggle${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="ns-mobile-tabs" id="ns-nav-menu">
            {TABS.map((t) => (
              <button
                key={t}
                className={`ns-mobile-tab${
                  activeTab === t ? ' active' : ''
                }${t === 'Contact' ? ' contact-tab' : ''}`}
                onClick={() => handleTab(t)}
                aria-current={activeTab === t ? 'page' : undefined}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`} aria-label="Main Navigation">
      <div className="container">
        <div className="ns-nav-top">
          <div
            className="ns-nav-logos"
            onClick={goHome}
            style={{ cursor: 'pointer' }}
            aria-label="Go to homepage"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && goHome()}
          >
            <img
              src={BRAND_LOGO_FULL}
              alt="NexaSphere"
              className="ns-nav-logo-ns ns-nav-logo-icon"
            />
            <div className="ns-nav-divider" />
            <span className="ns-nav-brand">NexaSphere</span>
          </div>

          <div
            className="ns-nav-actions"
            style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
          >
            <ThemeToggle />
          </div>
        </div>

        <div className="ns-nav-menu" id="ns-nav-menu">
          <ul className="ns-nav-tabs">
            {TABS.map((t) => (
              <li key={t}>
                <button
                  className={`ns-nav-tab${activeTab === t ? ' active' : ''}${
                    t === 'Contact' ? ' contact-tab contact-nav-tab' : ''
                  }`}
                  onClick={() => handleTab(t)}
                  aria-current={activeTab === t ? 'page' : undefined}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
