import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import glbajajLogo    from '../assets/images/logos/glbajaj-logo.png';

const NEXASPHERE_EMAIL = 'nexasphere@glbajajgroup.org';

export default function Footer() {
  return (
    <footer className="ns-footer">
      <div className="container">
        <div className="ns-footer-inner">
          <div style={{width:'100%',height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,212,255,.2),rgba(123,111,255,.2),transparent)',marginBottom:'18px'}}/>
          <div className="ns-footer-logos">
            <img src={nexasphereLogo} alt="NexaSphere" className="ns-footer-logo-ns"/>
            <div style={{width:1,height:24,background:'var(--bdr2)'}}/>
            <img src={glbajajLogo}    alt="GL Bajaj"   className="ns-footer-logo-gl"/>
          </div>
          <p className="ns-footer-text">© {new Date().getFullYear()} <span>NexaSphere</span> — GL Bajaj Group of Institutions, Mathura</p>
          <p className="ns-footer-text">
            📧{' '}
            <a href={`mailto:${NEXASPHERE_EMAIL}`} style={{color:'var(--c1)',fontWeight:600}}>
              {NEXASPHERE_EMAIL}
            </a>
          </p>
          <p className="ns-footer-text" style={{fontSize:'.72rem',opacity:.6}}>
            Built with ❤️ by the NexaSphere Core Team · Architected by Ayush Sharma
          </p>
        </div>
      </div>
    </footer>
  );
}
