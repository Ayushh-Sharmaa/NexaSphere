import { useState, useEffect, useRef } from 'react';
import './styles/globals.css';
import './styles/animations.css';
import './styles/components.css';

import ParticleBackground from './components/ParticleBackground';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ActivitiesSection from './components/ActivitiesSection';
import EventsSection from './components/EventsSection';
import AboutSection from './components/AboutSection';
import TeamSection from './components/TeamSection';
import Footer from './components/Footer';
import ActivityDetailPage from './components/ActivityDetailPage';
import EventDetailPage from './components/EventDetailPage';

import { activityPages } from './data/activities/index';
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';

const MOBILE_NAV_HEIGHT = 88;
const DESKTOP_NAV_HEIGHT = 64;
const SECTIONS = ['Home', 'Activities', 'Events', 'About', 'Team'];

// ── Page Transition Wrapper ──
function PageTransition({ children, pageKey }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [pageKey]);

  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.98)',
      transition: 'opacity 0.55s cubic-bezier(0.22,1,0.36,1), transform 0.55s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

// ── Wipe Overlay (flash on navigate) ──
function WipeOverlay({ active }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(99,102,241,0.15))',
      opacity: active ? 1 : 0,
      pointerEvents: 'none',
      transition: 'opacity 0.25s ease',
      backdropFilter: active ? 'blur(4px)' : 'blur(0px)',
    }} />
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [wiping, setWiping] = useState(false);

  // ── Page state ──
  // null = main page
  // { type: 'activity', activityKey: string } = activity detail
  // { type: 'event', activityKey: string, event: object } = event detail
  const [page, setPage] = useState(null);

  const cursorRef = useRef(null);

  // ── Splash ──
  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 1400);
    const t2 = setTimeout(() => setSplashDone(true), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Scroll Progress ──
  useEffect(() => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    const update = () => {
      const s = window.scrollY;
      const d = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = d > 0 ? `${(s / d) * 100}%` : '0%';
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  // ── Back to Top ──
  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    return () => window.removeEventListener('scroll', toggle);
  }, []);

  // ── Cursor Glow ──
  useEffect(() => {
    const glow = cursorRef.current;
    if (!glow) return;
    const move = (e) => { glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  // ── Active tab from scroll (main page only) ──
  useEffect(() => {
    if (page) return;
    const navH = isMobile ? MOBILE_NAV_HEIGHT : DESKTOP_NAV_HEIGHT;
    const onScroll = () => {
      const scrollY = window.scrollY + navH + 32;
      for (let i = SECTIONS.length - 1; i >= 0; i--) {
        const el = document.getElementById(`section-${SECTIONS[i].toLowerCase()}`);
        if (el && el.offsetTop <= scrollY) { setActiveTab(SECTIONS[i]); break; }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMobile, page]);

  // ── Resize ──
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Global scroll reveal ──
  useEffect(() => {
    if (!splashDone) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [splashDone, page]);

  // ── Wipe transition helper ──
  const wipeNavigate = (fn) => {
    setWiping(true);
    setTimeout(() => {
      fn();
      window.scrollTo({ top: 0 });
      setWiping(false);
    }, 220);
  };

  // ── Tab navigation ──
  const handleTabChange = (tab) => {
    wipeNavigate(() => {
      setPage(null);
      setActiveTab(tab);
      setTimeout(() => {
        const el = document.getElementById(`section-${tab.toLowerCase()}`);
        if (!el) return;
        const navH = isMobile ? MOBILE_NAV_HEIGHT : DESKTOP_NAV_HEIGHT;
        window.scrollTo({ top: el.offsetTop - navH, behavior: 'smooth' });
      }, 80);
    });
  };

  // ── Activity card click → activity detail page ──
  const handleNavigate = (type, activityTitle) => {
    if (type === 'activity') {
      wipeNavigate(() => setPage({ type: 'activity', activityKey: activityTitle }));
    }
  };

  // ── Event card click → event detail page ──
  const handleSelectEvent = (event) => {
    wipeNavigate(() =>
      setPage(prev => ({ ...prev, type: 'event', event }))
    );
  };

  // ── Back from event → activity ──
  const handleBackToActivity = () => {
    wipeNavigate(() =>
      setPage(prev => ({ type: 'activity', activityKey: prev.activityKey }))
    );
  };

  // ── Back from activity → main (activities section) ──
  const handleBackToMain = () => {
    wipeNavigate(() => {
      setPage(null);
      setTimeout(() => {
        const el = document.getElementById('section-activities');
        if (!el) return;
        const navH = isMobile ? MOBILE_NAV_HEIGHT : DESKTOP_NAV_HEIGHT;
        window.scrollTo({ top: el.offsetTop - navH, behavior: 'smooth' });
      }, 80);
    });
  };

  const navH = isMobile ? MOBILE_NAV_HEIGHT : DESKTOP_NAV_HEIGHT;
  const currentActivity = page?.activityKey ? activityPages[page.activityKey] : null;

  return (
    <>
      <div id="scroll-progress" />
      <div id="cursor-glow" ref={cursorRef} />
      <WipeOverlay active={wiping} />

      {/* Splash */}
      {!splashDone && (
        <div className={`splash-screen${splashFading ? ' fade-out' : ''}`}>
          <img src={nexasphereLogo} alt="NexaSphere" className="splash-logo" />
          <div className="splash-brand animated-gradient-text">NexaSphere</div>
          <div className="splash-spinner" />
        </div>
      )}

      <ParticleBackground />
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      <main style={{ paddingTop: navH, position: 'relative', zIndex: 1 }}>

        {/* ── Activity Detail Page ── */}
        {page?.type === 'activity' && currentActivity && (
          <PageTransition pageKey={`activity-${page.activityKey}`}>
            <ActivityDetailPage
              activity={currentActivity}
              onBack={handleBackToMain}
              onSelectEvent={handleSelectEvent}
            />
          </PageTransition>
        )}

        {/* ── Event Detail Page ── */}
        {page?.type === 'event' && page.event && currentActivity && (
          <PageTransition pageKey={`event-${page.event.id}`}>
            <EventDetailPage
              event={page.event}
              activityColor={currentActivity.color}
              activityIcon={currentActivity.icon}
              onBack={handleBackToActivity}
            />
          </PageTransition>
        )}

        {/* ── Main Page ── */}
        {!page && (
          <PageTransition pageKey="main">
            <HeroSection onTabChange={handleTabChange} />
            <ActivitiesSection onNavigate={handleNavigate} />
            <EventsSection />
            <AboutSection />
            <TeamSection />
            <Footer />
          </PageTransition>
        )}
      </main>

      <button id="back-to-top" aria-label="Back to top">↑</button>
    </>
  );
}
