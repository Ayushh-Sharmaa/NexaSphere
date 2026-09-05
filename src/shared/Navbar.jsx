import { useState, useEffect } from 'react';
import nexasphereAppLogo from '../assets/images/logos/nexasphere-app-logo.png';

const TABS = ['Home', 'Activities', 'Events', 'About', 'Team', 'Contact'];

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="ns-theme-toggle"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
    >
      {theme === 'dark' ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function Navbar({ activeTab, onTabChange, onToggleTheme, theme, onApply, onJoin }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobile,   setMobile]   = useState(window.innerWidth <= 768);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('resize', r, { passive: true });
    return () => {
      window.removeEventListener('scroll', s);
      window.removeEventListener('resize', r);
    };
  }, []);

  const handleTab = tab => onTabChange(tab);

  if (mobile) return (
    <nav className="ns-navbar-mobile">
      <div className="ns-mobile-top">
        <img src={nexasphereAppLogo} alt="NexaSphere" className="ns-mobile-logo-ns"/>
        <span className="ns-mobile-brand"><span>NexaSphere</span></span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div className="ns-mobile-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`ns-mobile-tab${activeTab === t ? ' active' : ''}${t === 'Contact' ? ' contact-tab' : ''}`}
            onClick={() => handleTab(t)}
          >
            {t}
          </button>
        ))}
        <button className="ns-mobile-tab ns-mobile-cta" onClick={onJoin} aria-label="Join as Member">Join</button>
        <button className="ns-mobile-tab ns-mobile-cta ns-mobile-cta-apply" onClick={onApply} aria-label="Apply for Core Team">Apply</button>
      </div>
    </nav>
  );

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        <div className="ns-nav-logos">
          <img src={nexasphereAppLogo} alt="NexaSphere" className="ns-nav-logo-ns"/>
          <div className="ns-nav-divider"/>
          <span className="ns-nav-brand">NexaSphere</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ul className="ns-nav-tabs">
            {TABS.map(t => (
              <li key={t}>
                <button
                  className={`ns-nav-tab${activeTab === t ? ' active' : ''}${t === 'Contact' ? ' contact-nav-tab' : ''}`}
                  onClick={() => handleTab(t)}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
          <div className="ns-nav-ctas">
            <button className="btn btn-sm btn-outline ns-nav-cta-btn" onClick={onJoin} aria-label="Join as Member">Join</button>
            <button className="btn btn-sm btn-primary ns-nav-cta-btn" onClick={onApply} aria-label="Apply for Core Team">Apply</button>
          </div>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </nav>
  );
}

