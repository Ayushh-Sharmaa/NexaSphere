import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BRAND_LOGO_FULL, BRAND_LOGO_ICON } from './brandAssets';
import NotificationBell from '../components/NotificationBell';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { useStudentAuth } from '../context/StudentAuthContext';
import LanguageSelector from '../components/common/LanguageSelector';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Settings, Trophy, UserRound } from 'lucide-react';
import { useWalkthroughStep } from '../hooks/useWalkthroughStep';
import { WalkthroughWrapper } from '../components/walkthrough/WalkthroughWrapper';

const TABS = [
  'Home',
  'Activities',
  'Events',
  'Projects',
  'Roadmaps',
  'Recommendations',
  'Portfolio',
  'Explore',
  'Resources',
  'Forum',
  'Gamification',
  'Mentorship',
  'About',
  'Core Team',
  'Contact',
];

// Bookmark toggle button for quick access to saved content.
// Used in both mobile and desktop navigation to provide users with
// convenient access to their bookmarked pages for a better navigation experience.
function BookmarkToggle({ onToggle }) {
  return (
    <button
      className="ns-bookmark-toggle"
      onClick={onToggle}
      aria-label="Open Bookmarks"
      title="Saved Bookmarks"
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--t1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px',
        borderRadius: '50%',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>
  );
}

export default function Navbar({
  activeTab,
  onTabChange,
  onApply,
  onJoin,
  onToggleBookmarks,
  onSearchToggle,
}) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();

  const getTabLabel = (tab) => {
    let key = tab.toLowerCase().replace(/\s+/g, '_');
    if (key === 'core_team') key = 'team';
    const translated = t(`nav.${key}`);
    return translated && !translated.startsWith('nav.') ? translated : tab;
  };
  const [compact, setCompact] = useState(window.innerWidth <= 1200);
  const [menuOpen, setMenuOpen] = useState(false);

  const eventsTabRef = useWalkthroughStep('search_events');

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => {
      const isCompact = window.innerWidth <= 1200;
      setCompact(isCompact);
      if (!isCompact) setMenuOpen(false);
    };
    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('resize', r, { passive: true });
    return () => {
      window.removeEventListener('scroll', s);
      window.removeEventListener('resize', r);
    };
  }, []);

  useEffect(() => {
    if (!compact || !menuOpen) return undefined;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [compact, menuOpen]);

  const { user, isAuthenticated, login } = useStudentAuth();

  const handleTab = (tab) => {
    setMenuOpen(false);
    onTabChange(tab);
  };

  const goHome = () => {
    setMenuOpen(false);
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (compact)
    return (
      <nav className="ns-navbar-mobile">
        <div
          className="ns-mobile-top"
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: 0,
          }}
        >
          <div
            onClick={goHome}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            aria-label="Go to homepage"
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <NotificationBell />
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notification history"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                padding: '2px 6px',
              }}
              title="View all notifications"
            >
              <ClipboardList size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              aria-label="Leaderboard"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              title="Open leaderboard"
            >
              <Trophy size={16} />
            </button>
            <button
              onClick={onSearchToggle}
              aria-label="Search"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
            <BookmarkToggle onToggle={onToggleBookmarks} />
            <ThemeToggle />
            <LanguageSelector />
            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="ns-nav-user-badge"
                  onClick={() => navigate('/settings/account')}
                  style={{
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--t1)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title="Settings & Privacy"
                  aria-label="Account settings"
                >
                  <Settings size={17} aria-hidden="true" />
                </button>
                <button
                  className="ns-nav-user-badge"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    color: 'var(--t1)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title={user?.name || user?.email}
                  aria-label={`View dashboard for ${user?.name || 'user'}`}
                >
                  <UserRound size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="ns-mobile-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`ns-mobile-tab${
                activeTab === t ? ' active' : ''
              }${t === 'Contact' ? ' contact-tab' : ''}`}
              onClick={() => handleTab(t)}
              aria-current={activeTab === t ? 'page' : undefined}
            >
              {getTabLabel(t)}
            </button>
          ))}

          <button
            className="ns-mobile-tab ns-mobile-cta"
            onClick={onJoin}
            aria-label="Join as Member"
          >
            {t('nav.join', 'Join')}
          </button>

          <button
            className="ns-mobile-tab ns-mobile-cta ns-mobile-cta-apply"
            onClick={onApply}
            aria-label="Apply for Core Team"
          >
            {t('nav.apply', 'Apply')}
          </button>
        </div>
      </nav>
    );

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`}>
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

          <div className="ns-nav-actions">
            <WalkthroughWrapper stepId="notifications" style={{ display: 'flex' }}>
              <NotificationBell />
            </WalkthroughWrapper>
            <button
              onClick={() => navigate('/notifications')}
              aria-label="Notification history"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t2)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                padding: '4px',
              }}
              title="View all notifications"
            >
              <ClipboardList size={16} aria-hidden="true" />
            </button>
            <button
              onClick={() => navigate('/leaderboard')}
              aria-label="Leaderboard"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--t1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '50%',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              title="Open leaderboard"
            >
              <Trophy size={16} />
            </button>
            <button
              onClick={onSearchToggle}
              aria-label="Open search (Ctrl+K)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                padding: '5px 12px',
                fontSize: '0.8rem',
                color: 'var(--t2)',
                cursor: 'pointer',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(204,17,17,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search...</span>
              <kbd
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '4px',
                  padding: '1px 5px',
                  fontSize: '0.65rem',
                  color: 'var(--t3)',
                  fontFamily: 'monospace',
                }}
              >
                Ctrl+K
              </kbd>
            </button>
            <BookmarkToggle onToggle={onToggleBookmarks} />
            <div className="ns-nav-ctas">
              <button
                className="btn btn-sm btn-outline ns-nav-cta-btn"
                onClick={onJoin}
                aria-label="Join as Member"
              >
                {t('nav.join', 'Join')}
              </button>

              <button
                className="btn btn-sm btn-primary ns-nav-cta-btn"
                onClick={onApply}
                aria-label="Apply for Core Team"
              >
                {t('nav.apply', 'Apply')}
              </button>
            </div>

            <ThemeToggle />
            <LanguageSelector />

            {isAuthenticated && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="ns-nav-user-badge"
                  onClick={() => navigate('/settings/account')}
                  style={{
                    cursor: 'pointer',
                    fontSize: '1rem',
                    color: 'var(--t1)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title="Settings & Privacy"
                  aria-label="Account settings"
                >
                  <Settings size={17} aria-hidden="true" />
                </button>
                <button
                  className="ns-nav-user-badge"
                  onClick={() => navigate('/dashboard')}
                  style={{
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--t1)',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    borderRadius: '4px',
                  }}
                  title={user?.name || user?.email}
                  aria-label={`View dashboard for ${user?.name || 'user'}`}
                >
                  <UserRound size={17} aria-hidden="true" />
                </button>
              </div>
            )}

            {isAuthenticated ? (
              <span
                className="ns-nav-user-badge"
                onClick={() => navigate('/dashboard')}
                style={{ cursor: 'pointer', fontSize: '0.9rem', color: 'var(--t1)' }}
                title={user?.name || user?.email}
              >
                <UserRound size={17} aria-hidden="true" />
              </span>
            ) : (
              <button
                className="btn btn-sm btn-outline"
                onClick={() => login('google')}
                aria-label="Sign in"
                style={{ marginLeft: '4px' }}
              >
                Login
              </button>
            )}

            <button
              className={`ns-nav-menu-toggle${menuOpen ? ' open' : ''}`}
              onClick={() => compact && setMenuOpen((open) => !open)}
              type="button"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-controls="ns-nav-menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div className="ns-nav-menu" id="ns-nav-menu" aria-hidden={compact ? !menuOpen : undefined}>
          <ul className="ns-nav-tabs">
            {TABS.map((t) => (
              <li key={t}>
                <button
                  className={`ns-nav-tab${activeTab === t ? ' active' : ''}${
                    t === 'Contact' ? ' contact-tab contact-nav-tab' : ''
                  }`}
                  ref={t === 'Events' ? eventsTabRef : null}
                  onClick={() => handleTab(t)}
                  aria-current={activeTab === t ? 'page' : undefined}
                >
                  {getTabLabel(t)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
