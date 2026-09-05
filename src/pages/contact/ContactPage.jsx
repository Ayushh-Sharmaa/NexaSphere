import { useEffect, useRef, useState } from 'react';
import glbajajLogo from '../../assets/images/logos/glbajaj-logo.png';

/* ─────────────────────────────────────────────────────────
   NEXASPHERE — CONTACT PAGE
   Sections:
     1. Hero banner
     2. Contact cards (Email · LinkedIn · WhatsApp)
     3. Find Us — embedded GL Bajaj map
     4. Send a message CTA (external mailto form)
───────────────────────────────────────────────────────── */

const EMAIL    = 'nexasphere@glbajajgroup.org';
const LINKEDIN = 'https://www.linkedin.com/showcase/glbajaj-nexasphere/';
const WHATSAPP = 'https://chat.whatsapp.com/Jjc5cuUKENu0RC1vWSEs20';

/* GL Bajaj Group of Institutions, Mathura coordinates */
const MAP_EMBED = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3548.9!2d77.6779!3d27.5706!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3973a5a9d0f5a4c5%3A0x9f5e2b8c1d2a3b4e!2sGL%20Bajaj%20Group%20of%20Institutions%2C%20Mathura!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin';

/* ── Particle burst on hover ── */
function useBurst(ref) {
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const burst = e => {
      for (let i = 0; i < 8; i++) {
        const p = document.createElement('span');
        const angle = (i / 8) * Math.PI * 2;
        const dist  = 40 + Math.random() * 30;
        p.style.cssText = `
          position:absolute;
          left:${e.clientX - el.getBoundingClientRect().left}px;
          top:${e.clientY - el.getBoundingClientRect().top}px;
          width:5px; height:5px; border-radius:50%;
          background:var(--c1);
          pointer-events:none; z-index:10;
          animation:contactBurst .55s ease forwards;
          --tx:${Math.cos(angle)*dist}px;
          --ty:${Math.sin(angle)*dist}px;
        `;
        el.appendChild(p);
        setTimeout(() => p.remove(), 600);
      }
    };
    el.addEventListener('click', burst);
    return () => el.removeEventListener('click', burst);
  }, []);
}

/* ── Contact Card ── */
function ContactCard({ icon, label, value, href, delay = 0, color }) {
  const ref = useRef(null);
  const [hov, setHov] = useState(false);
  useBurst(ref);

  return (
    <a
      ref={ref}
      href={href}
      target={href.startsWith('mailto') ? '_self' : '_blank'}
      rel="noopener noreferrer"
      className="contact-card pop-flip shimmer"
      style={{ animationDelay: `${delay}s`, textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <style>{`@keyframes contactBurst{to{transform:translate(var(--tx),var(--ty));opacity:0}}`}</style>

      
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: `radial-gradient(ellipse at 50% 0%, ${color}18 0%, transparent 60%)`,
        opacity: hov ? 1 : 0, transition: 'opacity .3s',
        pointerEvents: 'none',
      }}/>

      
      <div className="corner-tl"/><div className="corner-br"/>

      
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 20px',
        background: `${color}15`, border: `2px solid ${color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.75rem',
        boxShadow: hov ? `0 0 24px ${color}40` : 'none',
        transition: 'box-shadow .3s, transform .3s cubic-bezier(.34,1.56,.64,1)',
        transform: hov ? 'scale(1.15) rotate(8deg)' : 'scale(1)',
      }}>
        {icon}
      </div>

      <div style={{
        fontFamily: 'Orbitron,monospace', fontSize: '.72rem', fontWeight: 700,
        color: color, letterSpacing: '.12em', textTransform: 'uppercase',
        marginBottom: 8, textAlign: 'center',
      }}>{label}</div>

      <div style={{
        color: 'var(--t1)', fontSize: '.9rem', fontWeight: 600,
        textAlign: 'center', lineHeight: 1.45, wordBreak: 'break-all',
      }}>{value}</div>

      <div style={{
        marginTop: 14, textAlign: 'center', fontSize: '.72rem',
        color: color, letterSpacing: '.08em', opacity: hov ? 1 : .55,
        transition: 'opacity .2s',
        fontWeight: 700, textTransform: 'uppercase',
      }}>
        {href.startsWith('mailto') ? 'Send Email →' :
         href.includes('linkedin') ? 'Open LinkedIn →' : 'Join Chat →'}
      </div>
    </a>
  );
}

/* ── Map Section ── */
function MapSection() {
  const [loaded, setLoaded] = useState(false);
  const [show, setShow]     = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShow(true); obs.disconnect(); }
    }, { threshold: .15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="pop-in map-wrapper" style={{ maxWidth: 900, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontFamily: 'Space Mono,monospace', fontSize: '.65rem',
          color: 'var(--t3)', letterSpacing: '.28em', textTransform: 'uppercase',
        }}>📍 FIND US</span>
        <h3 style={{
          fontFamily: 'Orbitron,monospace', fontSize: 'clamp(1.1rem,3vw,1.6rem)',
          fontWeight: 700, marginTop: 8, marginBottom: 6,
          background: 'linear-gradient(135deg,var(--c1),var(--c2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>GL Bajaj Group of Institutions</h3>
        <p style={{ color: 'var(--t2)', fontSize: '.9rem' }}>
          Mathura – Delhi Highway (NH-2), Near Crossing Republic, Mathura, UP 281406
        </p>
      </div>

      
      <div style={{
        position: 'relative', borderRadius: 'var(--r3)',
        overflow: 'hidden', border: '1px solid var(--bdr2)',
        boxShadow: 'var(--sh1)',
        aspectRatio: '16/7',
        background: 'var(--card)',
      }}>
        
        <div className="corner-tl" style={{ width: 20, height: 20 }}/>
        <div className="corner-br" style={{ width: 20, height: 20 }}/>

        
        {!loaded && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, zIndex: 2, background: 'var(--card)',
          }}>
            <div style={{ fontSize: '2rem', animation: 'float 2s ease-in-out infinite' }}>📍</div>
            <div style={{
              fontFamily: 'Space Mono,monospace', fontSize: '.6rem',
              color: 'var(--t3)', letterSpacing: '.2em',
            }}>LOADING MAP...</div>
            <div style={{
              width: 120, height: 2, borderRadius: 2,
              background: 'var(--bdr)',
              overflow: 'hidden', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%', width: '60%',
                background: 'linear-gradient(90deg,var(--c1),var(--c2))',
                animation: 'shimmerBar 1.2s ease-in-out infinite',
              }}/>
            </div>
          </div>
        )}

        {show && (
          <iframe
            src={MAP_EMBED}
            width="100%" height="100%"
            style={{
              border: 0, display: 'block',
              filter: 'saturate(.9) contrast(1.05)',
              opacity: loaded ? 1 : 0,
              transition: 'opacity .5s ease',
            }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="GL Bajaj Group of Institutions, Mathura"
            onLoad={() => setLoaded(true)}
          />
        )}

        
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg,rgba(0,212,255,.03) 0%,transparent 30%,transparent 70%,rgba(123,111,255,.03) 100%)',
          mixBlendMode: 'screen',
        }}/>
      </div>

      
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <a
          href="https://maps.google.com/?q=GL+Bajaj+Group+of+Institutions+Mathura"
          target="_blank" rel="noopener noreferrer"
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex' }}
        >
          🗺️ Open in Google Maps
        </a>
      </div>
    </div>
  );
}

/* ── Message form CTA ── */
function MessageCTA() {
  const [name,    setName]    = useState('');
  const [message, setMessage] = useState('');
  const [copied,  setCopied]  = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const subject = encodeURIComponent(`Hi NexaSphere${name ? ` — ${name}` : ''}`);
  const body    = encodeURIComponent(
    `Hello NexaSphere Team,\n\n${message || '[Your message here]'}\n\nBest,\n${name || 'Your Name'}`
  );

  return (
    <div className="pop-scale message-cta-box" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="corner-tl"/><div className="corner-br"/>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>✉️</div>
        <h3 style={{
          fontFamily: 'Orbitron,monospace', fontSize: 'clamp(1rem,2.5vw,1.3rem)',
          fontWeight: 700, marginBottom: 8,
          background: 'linear-gradient(135deg,var(--c1),var(--c2))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Drop Us a Message</h3>
        <p style={{ color: 'var(--t2)', fontSize: '.88rem', lineHeight: 1.6 }}>
          For collaborations, queries, or just to say hi —<br/>we respond to every message.
        </p>
      </div>

      {/* Name field */}
      <div style={{ marginBottom: 12 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name (optional)"
          style={{
            width: '100%', padding: '12px 16px',
            background: 'var(--card2)', border: '1px solid var(--bdr2)',
            borderRadius: 'var(--r2)', color: 'var(--t1)',
            fontFamily: 'Rajdhani,sans-serif', fontSize: '.95rem',
            outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Message body field */}
      <div style={{ marginBottom: 16 }}>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Your message — what would you like to tell us?"
          rows={5}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'var(--card2)', border: '1px solid var(--bdr2)',
            borderRadius: 'var(--r2)', color: 'var(--t1)',
            fontFamily: 'Rajdhani,sans-serif', fontSize: '.95rem',
            outline: 'none', resize: 'vertical', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--c1b)'; e.target.style.boxShadow = 'var(--sh1)'; }}
          onBlur={e  => { e.target.style.borderColor = 'var(--bdr2)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        <a
          href={`mailto:${EMAIL}?subject=${subject}&body=${body}`}
          className="btn btn-primary btn-ripple"
          style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
        >
          📧 Open Email App
        </a>
        <button
          className="btn btn-outline btn-ripple"
          onClick={handleCopy}
          style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
        >
          {copied ? '✅ Copied!' : '📋 Copy Email'}
        </button>
      </div>

      <p style={{
        textAlign: 'center', marginTop: 14,
        fontFamily: 'Space Mono,monospace', fontSize: '.6rem',
        color: 'var(--t3)', letterSpacing: '.15em',
      }}>
        {EMAIL}
      </p>
    </div>
  );
}

/* ══════════════════ MAIN EXPORT ══════════════════ */
export default function ContactPage({ onBack }) {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('fired'); obs.unobserve(e.target); }
      });
    }, { threshold: .1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('#pg-contact .pop-flip, #pg-contact .pop-in, #pg-contact .pop-word, #pg-contact .pop-scale')
      .forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div id="pg-contact">
      <style>{`
        /* ── Contact Card ── */
        .contact-card {
          background: var(--card);
          border: 1px solid var(--bdr);
          border-radius: var(--r3);
          padding: 32px 24px 28px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: border-color .28s, box-shadow .28s, transform .3s cubic-bezier(.22,1,.36,1) !important;
        }
        .contact-card:hover {
          border-color: var(--c1b);
          box-shadow: var(--sh1), 0 20px 50px rgba(0,0,0,.45);
          transform: translateY(-10px) scale(1.02) !important;
          text-decoration: none;
        }
        [data-theme="light"] .contact-card { background:#fff; border-color:rgba(28,25,23,.09); }
        [data-theme="light"] .contact-card:hover { border-color:rgba(194,119,10,.3); box-shadow:0 8px 28px rgba(194,119,10,.1); }

        /* ── Map ── */
        .map-wrapper { opacity:0; }
        .map-wrapper.fired { opacity:1; transition: opacity .5s ease; }

        /* ── Message box ── */
        .message-cta-box {
          background: var(--card);
          border: 1px solid var(--bdr);
          border-radius: var(--r3);
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
        }
        [data-theme="light"] .message-cta-box { background:#fff; }

        /* ── Shimmer bar (map loading) ── */
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }

        /* ── Hero banner ── */
        .contact-hero {
          text-align: center;
          padding: 64px 24px 52px;
          position: relative;
        }
        .contact-hero-bg {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,212,255,.08) 0%, transparent 65%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(123,111,255,.05) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 80% 70%, rgba(189,92,255,.04) 0%, transparent 55%);
        }
        [data-theme="light"] .contact-hero-bg {
          background:
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(194,119,10,.06) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 20% 80%, rgba(109,40,217,.04) 0%, transparent 55%);
        }
        .contact-divider {
          width: 100%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--c1) 20%, var(--c2) 50%, var(--c3) 80%, transparent);
          opacity: .2; margin: 0 auto;
        }

        @media (max-width: 640px) {
          .message-cta-box { padding: 24px 18px; }
          .contact-card { padding: 24px 18px 22px; }
        }
      `}</style>

      
      <div className="contact-hero">
        <div className="contact-hero-bg"/>
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-outline btn-sm"
            style={{ position: 'absolute', top: 24, left: 24 }}
          >
            ← Back
          </button>
        )}
        <span className="cin-section-label pop-in">Get In Touch</span>
        <h1 className="section-title pop-word" style={{ marginBottom: 16 }}>Contact Us</h1>
        <p className="pop-in" style={{
          color: 'var(--t2)', fontSize: 'clamp(.9rem,2vw,1.08rem)',
          maxWidth: 540, margin: '0 auto', lineHeight: 1.7,
          animationDelay: '.12s',
        }}>
          We&apos;re a student-run community — always happy to connect, collaborate, and answer questions.
        </p>
        <div className="contact-divider" style={{ marginTop: 40, maxWidth: 600 }}/>
      </div>

      <div className="container" style={{ paddingBottom: 80 }}>

        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 18, marginBottom: 72,
        }}
          className="cin-container"
        >
          <ContactCard
            icon="📧" label="Email" delay={0}
            value={EMAIL}
            href={`mailto:${EMAIL}`}
            color="var(--c1)"
          />
          <ContactCard
            icon="🔗" label="LinkedIn" delay={0.08}
            value="NexaSphere · GL Bajaj"
            href={LINKEDIN}
            color="var(--c2)"
          />
          <ContactCard
            icon="💬" label="WhatsApp Community" delay={0.16}
            value="Join our active community group"
            href={WHATSAPP}
            color="var(--c5)"
          />
        </div>

        
        <div style={{ marginBottom: 72 }}>
          <MapSection/>
        </div>

        
        <div className="contact-divider" style={{ maxWidth: 400, margin: '0 auto 64px' }}/>

        
        <MessageCTA/>

        
        <div className="pop-in" style={{
          textAlign: 'center', marginTop: 56,
          padding: '24px', maxWidth: 520, margin: '56px auto 0',
          background: 'var(--card)', border: '1px solid var(--bdr)',
          borderRadius: 'var(--r3)', position: 'relative',
        }}>
          <div className="corner-tl"/><div className="corner-br"/>
          <img src={glbajajLogo} alt="GL Bajaj" style={{
            height: 38, margin: '0 auto 12px',
            background: 'rgba(255,255,255,.88)',
            padding: '3px 8px', borderRadius: 6,
          }}/>
          <div style={{
            fontFamily: 'Orbitron,monospace', fontSize: '.72rem',
            color: 'var(--c1)', fontWeight: 700, letterSpacing: '.1em',
            textTransform: 'uppercase', marginBottom: 6,
          }}>GL Bajaj Group of Institutions</div>
          <p style={{ color: 'var(--t2)', fontSize: '.83rem', lineHeight: 1.65 }}>
            Mathura – Delhi Highway (NH-2),<br/>
            Near Crossing Republic, Mathura,<br/>
            Uttar Pradesh — 281406
          </p>
          <a
            href="tel:+915652400400"
            style={{ display: 'block', marginTop: 10, color: 'var(--c1)', fontSize: '.85rem', fontWeight: 600 }}
          >
            📞 +91-565-2400400
          </a>
        </div>

      </div>
    </div>
  );
}

