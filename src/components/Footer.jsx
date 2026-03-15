import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import glbajajLogo from '../assets/images/logos/glbajaj-logo.png';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ns-footer">
      <div className="container">
        <div className="ns-footer-inner">
          <div className="ns-footer-logos">
            <img src={nexasphereLogo} alt="NexaSphere" className="ns-footer-logo" />
            <div style={{ width: 1, height: 28, background: 'var(--border-subtle)' }} />
            <img src={glbajajLogo} alt="GL Bajaj" className="ns-footer-logo" />
          </div>
          <p className="ns-footer-text">
            © {year} <span>NexaSphere</span> — GL Bajaj Group of Institutions, Mathura.
            All rights reserved.
          </p>
          <p className="ns-footer-text" style={{ fontSize: '0.78rem' }}>
            Built with ❤️ by the NexaSphere Core Team
          </p>
        </div>
      </div>
    </footer>
  );
}
