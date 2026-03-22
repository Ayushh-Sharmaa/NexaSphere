import { useState, useEffect } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';

const TABS = ['Home','Activities','Events','About','Team'];

export default function Navbar({ activeTab, onTabChange }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobile,   setMobile]   = useState(window.innerWidth <= 768);

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 20);
    const r = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('scroll', s, { passive:true });
    window.addEventListener('resize', r, { passive:true });
    return () => { window.removeEventListener('scroll', s); window.removeEventListener('resize', r); };
  }, []);

  if (mobile) return (
    <nav className="ns-navbar-mobile">
      <div className="ns-mobile-top">
        <img src={nexasphereLogo} alt="NexaSphere" className="ns-mobile-logo-ns"/>
        <span className="ns-mobile-brand"><span>NexaSphere</span></span>
      </div>
      <div className="ns-mobile-tabs">
        {TABS.map(t => (
          <button key={t} className={`ns-mobile-tab${activeTab===t?' active':''}`} onClick={()=>onTabChange(t)}>{t}</button>
        ))}
      </div>
    </nav>
  );

  return (
    <nav className={`ns-navbar${scrolled?' scrolled':''}`}>
      <div className="container">
        {/* Left: NexaSphere brand */}
        <div className="ns-nav-logos">
          <img src={nexasphereLogo} alt="NexaSphere" className="ns-nav-logo-ns"/>
          <div className="ns-nav-divider"/>
          <span className="ns-nav-brand">NexaSphere</span>
        </div>
        {/* Right: tabs + GL Bajaj logo */}
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <ul className="ns-nav-tabs">
            {TABS.map(t => (
              <li key={t}>
                <button className={`ns-nav-tab${activeTab===t?' active':''}`} onClick={()=>onTabChange(t)}>{t}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
