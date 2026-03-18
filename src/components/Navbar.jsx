import { useState, useEffect } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import glbajajLogo    from '../assets/images/logos/glbajaj-logo.png';

const TABS = ['Home', 'Activities', 'Events', 'About', 'Team'];

export default function Navbar({ activeTab, onTabChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  if (isMobile) {
    return (
      <nav className="ns-navbar-mobile">
        <div className="ns-mobile-top">
          <img src={nexasphereLogo} alt="NexaSphere" className="ns-mobile-logo"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }} />
          <span className="ns-mobile-brand">NexaSphere</span>
          <img src={glbajajLogo} alt="GL Bajaj" className="ns-mobile-logo" />
        </div>
        <div className="ns-mobile-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`ns-mobile-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => onTabChange(tab)}
            >{tab}</button>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className={`ns-navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="container">
        {/* Left */}
        <div className="ns-nav-logos">
          <img src={nexasphereLogo} alt="NexaSphere" className="ns-nav-logo-img" />
          <div className="ns-nav-divider" />
          <span className="ns-nav-brand">NexaSphere</span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ul className="ns-nav-tabs">
            {TABS.map(tab => (
              <li key={tab}>
                <button
                  className={`ns-nav-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => onTabChange(tab)}
                >{tab}</button>
              </li>
            ))}
          </ul>
          <div className="ns-nav-divider" />
          <img src={glbajajLogo} alt="GL Bajaj" className="ns-nav-logo-img" style={{ height: '32px' }} />
        </div>
      </div>
    </nav>
  );
}
