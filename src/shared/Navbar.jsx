import { useState, useEffect } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';


const TABS = ['Home', 'Activities', 'Events', 'About', 'Team', 'Apply', 'Contact'];

export default function Navbar({ activeTab, onTabChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobile,   setMobile]   = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => { setMobile(window.innerWidth <= 768); setMenuOpen(false); };
    window.addEventListener('scroll', s, { passive: true });
    window.addEventListener('resize', r, { passive: true });
    return () => {
      window.removeEventListener('scroll', s);
      window.removeEventListener('resize', r);
    };
  }, []);

  const handleTab = tab => {
    setMenuOpen(false);
    onTabChange(tab);
  };

  if (mobile) return (
    <nav className="ns-navbar-mobile">
      <div className="ns-mobile-top">
        <img src={nexasphereLogo} alt="NexaSphere" className="ns-mobile-logo-ns"/>
        <span className="ns-mobile-brand"><span>NexaSphere</span></span>

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
      </div>
    </nav>
  );

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        {/* Left: brand */}
        <div className="ns-nav-logos">
          <img src={nexasphereLogo} alt="NexaSphere" className="ns-nav-logo-ns"/>
          <div className="ns-nav-divider"/>
          <span className="ns-nav-brand">NexaSphere</span>
        </div>

        {/* Right: tabs + GL Bajaj */}
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

        </div>
      </div>
    </nav>
  );
}
