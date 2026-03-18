import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import glbajajLogo    from '../assets/images/logos/glbajaj-logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ns-footer">
      <div className="container">
        <div className="ns-footer-inner">
          {/* Divider line with glow */}
          <div style={{
            width: '100%', height: '1px', marginBottom: '24px',
            background: 'linear-gradient(90deg,transparent,rgba(0,229,255,0.3),rgba(124,110,255,0.3),transparent)',
            boxShadow: '0 0 12px rgba(0,229,255,0.15)',
          }} />

          <div className="ns-footer-logos">
            <img src={nexasphereLogo} alt="NexaSphere" className="ns-footer-logo" />
            <div style={{ width: 1, height: 28, background: 'rgba(0,229,255,0.15)' }} />
            <img src={glbajajLogo} alt="GL Bajaj" className="ns-footer-logo" />
          </div>

          <p className="ns-footer-text">
            © {year} <span>NexaSphere</span> — GL Bajaj Group of Institutions, Mathura
          </p>
          <p className="ns-footer-text" style={{ fontSize: '0.75rem', opacity: 0.7 }}>
            Built with ❤️ by the NexaSphere Core Team · Proposed by Tanishk Bansal &amp; Ayush Sharma
          </p>

          {/* Bottom tech line */}
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '0.62rem', color: 'rgba(0,229,255,0.2)',
            letterSpacing: '0.2em', marginTop: '8px',
          }}>
            REACT + VITE + GITHUB PAGES · v2.0
          </div>
        </div>
      </div>
    </footer>
  );
}
