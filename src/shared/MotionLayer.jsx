/**
 * MotionLayer.jsx — NexaSphere Motion Engine v3 (Full-Site)
 *
 * Non-destructive: adds NEW effects only. Never modifies existing
 * pop-in / pop-word / ag animation logic.
 */

import { useEffect } from 'react';

/* ── AMBIENT ORBS ─────────────────────────────────────── */
const ORBS_DARK = [
  { w:600, h:600, top:'5%',  left:'2%',  bg:'rgba(0,212,255,.18)',   dur:'18s', delay:'0s',   lo:'.12', hi:'.22' },
  { w:500, h:500, top:'50%', left:'72%', bg:'rgba(123,111,255,.20)', dur:'24s', delay:'-8s',  lo:'.14', hi:'.24' },
  { w:420, h:420, top:'28%', left:'52%', bg:'rgba(189,92,255,.15)',  dur:'20s', delay:'-5s',  lo:'.10', hi:'.20' },
  { w:340, h:340, top:'78%', left:'18%', bg:'rgba(0,255,157,.12)',   dur:'28s', delay:'-13s', lo:'.08', hi:'.16' },
  { w:280, h:280, top:'12%', left:'65%', bg:'rgba(255,45,120,.12)',  dur:'22s', delay:'-3s',  lo:'.08', hi:'.16' },
];
const ORBS_LIGHT = [
  { w:600, h:600, top:'5%',  left:'2%',  bg:'rgba(194,119,10,.14)', dur:'18s', delay:'0s',   lo:'.08', hi:'.16' },
  { w:500, h:500, top:'50%', left:'72%', bg:'rgba(91,33,182,.12)',  dur:'24s', delay:'-8s',  lo:'.07', hi:'.14' },
  { w:420, h:420, top:'28%', left:'52%', bg:'rgba(157,23,77,.10)',  dur:'20s', delay:'-5s',  lo:'.06', hi:'.12' },
  { w:340, h:340, top:'78%', left:'18%', bg:'rgba(6,95,70,.08)',    dur:'28s', delay:'-13s', lo:'.05', hi:'.10' },
  { w:280, h:280, top:'12%', left:'65%', bg:'rgba(232,99,122,.09)', dur:'22s', delay:'-3s',  lo:'.05', hi:'.10' },
];

export function AmbientOrbs({ theme = 'dark' }) {
  const orbs = theme === 'light' ? ORBS_LIGHT : ORBS_DARK;
  return (
    <div aria-hidden="true" style={{ pointerEvents:'none', zIndex:0 }}>
      {orbs.map((o, i) => (
        <div key={i} className="ambient-orb" style={{
          width:o.w, height:o.h, top:o.top, left:o.left,
          background:o.bg,
          '--orb-dur':o.dur, '--orb-delay':o.delay,
          '--orb-lo':o.lo,  '--orb-hi':o.hi,
        }}/>
      ))}
    </div>
  );
}

/* ── SECTION DIVIDER ─────────────────────────────────── */
export function SectionDivider() {
  return <div className="section-divider" aria-hidden="true"/>;
}

/* ── PAGE FLASH — visible radial glow on tab-switch ──── */
export function PageFlash() {
  return <div className="page-flash" aria-hidden="true"/>;
}

/* ────────────────────────────────────────────────────────
   PAGE BANNER ORBS — decorative floating orbs inside
   each tab page's hero banner (not ambient layer)
   ──────────────────────────────────────────────────────── */
export function BannerOrbs({ color = 'rgba(0,212,255,.06)' }) {
  const specs = [
    { w:260, h:260, t:'30%', l:'15%', dur:'14s', delay:'0s'  },
    { w:200, h:200, t:'20%', l:'70%', dur:'18s', delay:'-6s' },
    { w:140, h:140, t:'70%', l:'50%', dur:'12s', delay:'-3s' },
  ];
  return (
    <>
      {specs.map((s, i) => (
        <div key={i} aria-hidden="true" style={{
          position:'absolute', width:s.w, height:s.h,
          top:s.t, left:s.l, transform:'translate(-50%,-50%)',
          borderRadius:'50%', background:color,
          filter:'blur(48px)', pointerEvents:'none',
          animation:`ag ${s.dur} ease-in-out ${s.delay} infinite`,
          zIndex:0,
        }}/>
      ))}
    </>
  );
}
export function useScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    const update = () => {
      const d = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = d > 0 ? (window.scrollY / d * 100).toFixed(2) + '%' : '0%';
    };
    window.addEventListener('scroll', update, { passive:true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);
}

/* ── useNsReveal — fires .ns-visible on scroll ────────── */
export function useNsReveal(deps = []) {
  useEffect(() => {
    
    const t = setTimeout(() => {
      const SEL = '.ns-reveal,.ns-reveal-left,.ns-reveal-right,.ns-reveal-scale';
      const els = document.querySelectorAll(SEL);
      if (!els.length) return;
      const obs = new IntersectionObserver(
        entries => entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('ns-visible'); obs.unobserve(e.target); }
        }),
        { threshold:0.05, rootMargin:'0px 0px -20px 0px' }
      );
      
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight + 80) {
          el.classList.add('ns-visible');
        } else {
          obs.observe(el);
        }
      });
      return () => obs.disconnect();
    }, 80);
    return () => clearTimeout(t);
  
  }, deps);
}

/* Backwards-compat alias */
export function useRevealStagger(deps = []) { useNsReveal(deps); }

/* ── useHeroParallax ──────────────────────────────────── */
export function useHeroParallax() {
  useEffect(() => {
    let raf;
    const tick = () => {
      const el = document.querySelector('.hero-bg-parallax');
      if (el) el.style.transform = `scale(1.06) translateY(${window.scrollY * 0.28}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
}

/* ── useNavScrollTint ─────────────────────────────────── */
export function useNavScrollTint() {
  useEffect(() => {
    const update = () => {
      const nav = document.querySelector('.ns-navbar');
      if (!nav) return;
      const r = Math.min(window.scrollY / 180, 1);
      nav.style.backdropFilter = `blur(${24 + r * 10}px) saturate(${180 + r * 60}%)`;
    };
    window.addEventListener('scroll', update, { passive:true });
    return () => window.removeEventListener('scroll', update);
  }, []);
}

/* ── useGlobalMouseParallax ───────────────────────────── */
export function useGlobalMouseParallax() {
  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    let mx = 0, my = 0, raf;
    const onMove = e => { mx = e.clientX; my = e.clientY; };
    const tick = () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (mx - cx) / cx;
      const dy = (my - cy) / cy;
      document.querySelectorAll('[data-parallax]').forEach(el => {
        const depth = parseFloat(el.dataset.parallax) || 10;
        el.style.transform = `translate(${dx * depth}px, ${dy * depth}px)`;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive:true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('mousemove', onMove); };
  }, []);
}

/* ── useMagneticCards — .mag-card 3D tilt ────────────── */
export function useMagneticCards() {
  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    const apply = e => {
      document.querySelectorAll('.mag-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxD = Math.max(rect.width, rect.height) * 1.2;
        if (dist < maxD) {
          const t  = 1 - dist / maxD;
          const rx = ( dy / rect.height * t * 10).toFixed(2);
          const ry = (-dx / rect.width  * t * 10).toFixed(2);
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
        } else {
          card.style.transform = '';
        }
      });
    };
    const reset = () => document.querySelectorAll('.mag-card').forEach(c => { c.style.transform = ''; });
    window.addEventListener('mousemove', apply, { passive:true });
    window.addEventListener('mouseleave', reset);
    return () => { window.removeEventListener('mousemove', apply); window.removeEventListener('mouseleave', reset); };
  }, []);
}

