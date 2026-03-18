import { useState, useEffect, useRef, useCallback } from 'react';
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

// ── Crazy wipe transition ──
function WipeTransition({ active, phase }) {
  // phase: 'out' = covering, 'in' = revealing
  return (
    <>
      <style>{`
        @keyframes wipeDown  { from{transform:scaleY(0);transform-origin:top}    to{transform:scaleY(1);transform-origin:top} }
        @keyframes wipeUp    { from{transform:scaleY(1);transform-origin:bottom} to{transform:scaleY(0);transform-origin:bottom} }
        @keyframes glitchIn  { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0 0 0)} }
        @keyframes glitchOut { 0%{clip-path:inset(0 0 0 0)} 100%{clip-path:inset(0 0 0 100%)} }
      `}</style>
      {active && (
        <>
          {/* Main wipe layer */}
          <div style={{
            position:'fixed', inset:0, zIndex:8000,
            background:'linear-gradient(135deg,var(--bg-primary) 40%,rgba(0,212,255,0.06) 100%)',
            animation: phase==='out' ? 'wipeDown 0.3s cubic-bezier(0.77,0,0.18,1) forwards'
                                     : 'wipeUp 0.35s cubic-bezier(0.77,0,0.18,1) forwards',
            pointerEvents:'all',
          }} />
          {/* Cyan stripe */}
          <div style={{
            position:'fixed', inset:0, zIndex:8001,
            background:'linear-gradient(90deg,var(--cyan),var(--indigo),var(--purple))',
            opacity:0.12,
            animation: phase==='out' ? 'wipeDown 0.25s 0.05s cubic-bezier(0.77,0,0.18,1) forwards'
                                     : 'wipeUp 0.3s 0.05s cubic-bezier(0.77,0,0.18,1) forwards',
            pointerEvents:'none',
          }} />
          {/* NexaSphere logo center flash */}
          {phase==='out' && (
            <div style={{
              position:'fixed', top:'50%', left:'50%',
              transform:'translate(-50%,-50%)',
              zIndex:8002, pointerEvents:'none',
              opacity:0, animation:'splashFadeIn 0.2s 0.15s ease forwards',
            }}>
              <img src={nexasphereLogo} style={{height:'60px', filter:'drop-shadow(0 0 20px var(--cyan))', opacity:0.7}} alt="" />
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Page wrapper with enter animation ──
function PageEnter({ children, pageKey }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(()=>setReady(true),40); return ()=>clearTimeout(t); }, [pageKey]);
  return (
    <div style={{
      opacity: ready?1:0,
      transform: ready?'translateY(0) scale(1)':'translateY(20px) scale(0.99)',
      transition:'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {children}
    </div>
  );
}

// ── Enhanced cursor glow ──
function CursorGlow() {
  const ref = useRef(null);
  const dot  = useRef(null);
  useEffect(()=>{
    let x=0,y=0,tx=0,ty=0;
    const move = e => { tx=e.clientX; ty=e.clientY; };
    const tick = () => {
      x += (tx-x)*0.08; y += (ty-y)*0.08;
      if (ref.current) { ref.current.style.left=x+'px'; ref.current.style.top=y+'px'; }
      if (dot.current) { dot.current.style.left=tx+'px'; dot.current.style.top=ty+'px'; }
      requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove',move);
    const raf = requestAnimationFrame(tick);
    return ()=>{ window.removeEventListener('mousemove',move); cancelAnimationFrame(raf); };
  },[]);
  return (
    <>
      {/* Big soft glow - follows with lag */}
      <div ref={ref} style={{
        position:'fixed', pointerEvents:'none', zIndex:0,
        width:'500px', height:'500px', borderRadius:'50%',
        background:'radial-gradient(circle,rgba(0,212,255,0.04) 0%,transparent 70%)',
        transform:'translate(-50%,-50%)',
        transition:'none',
      }} />
      {/* Small sharp dot - follows precisely */}
      <div ref={dot} style={{
        position:'fixed', pointerEvents:'none', zIndex:1,
        width:'6px', height:'6px', borderRadius:'50%',
        background:'#00e5ff', opacity:0.75,
        transform:'translate(-50%,-50%)',
        boxShadow:'0 0 14px rgba(0,229,255,0.9)',
        transition:'none',
      }} />
    </>
  );
}

export default function App() {
  const [splashDone,   setSplashDone]   = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [activeTab,    setActiveTab]    = useState('Home');
  const [isMobile,     setIsMobile]     = useState(window.innerWidth<=768);
  const [wipeActive,   setWipeActive]   = useState(false);
  const [wipePhase,    setWipePhase]    = useState('out');
  const [page,         setPage]         = useState(null);

  // ── Splash ──
  useEffect(()=>{
    const t1=setTimeout(()=>setSplashFading(true),1400);
    const t2=setTimeout(()=>setSplashDone(true),1900);
    return()=>{clearTimeout(t1);clearTimeout(t2);};
  },[]);

  // ── Scroll progress ──
  useEffect(()=>{
    const bar=document.getElementById('scroll-progress');
    if(!bar)return;
    const update=()=>{
      const s=window.scrollY, d=document.documentElement.scrollHeight-window.innerHeight;
      bar.style.width=d>0?`${(s/d)*100}%`:'0%';
    };
    window.addEventListener('scroll',update,{passive:true});
    return()=>window.removeEventListener('scroll',update);
  },[]);

  // ── Back to top ──
  useEffect(()=>{
    const btn=document.getElementById('back-to-top');
    if(!btn)return;
    const toggle=()=>btn.classList.toggle('visible',window.scrollY>400);
    window.addEventListener('scroll',toggle,{passive:true});
    btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    return()=>window.removeEventListener('scroll',toggle);
  },[]);

  // ── Active tab from scroll ──
  useEffect(()=>{
    if(page)return;
    const navH=isMobile?MOBILE_NAV_HEIGHT:DESKTOP_NAV_HEIGHT;
    const onScroll=()=>{
      const scrollY=window.scrollY+navH+32;
      for(let i=SECTIONS.length-1;i>=0;i--){
        const el=document.getElementById(`section-${SECTIONS[i].toLowerCase()}`);
        if(el&&el.offsetTop<=scrollY){setActiveTab(SECTIONS[i]);break;}
      }
    };
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>window.removeEventListener('scroll',onScroll);
  },[isMobile,page]);

  // ── Resize ──
  useEffect(()=>{
    const r=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize',r);
    return()=>window.removeEventListener('resize',r);
  },[]);

  // ── Scroll reveal ──
  useEffect(()=>{
    if(!splashDone)return;
    const obs=new IntersectionObserver(
      entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),
      {threshold:0.08}
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale').forEach(el=>obs.observe(el));
    return()=>obs.disconnect();
  },[splashDone,page]);

  // ── Wipe transition helper ──
  const wipeNavigate = useCallback((fn)=>{
    setWipeActive(true); setWipePhase('out');
    setTimeout(()=>{
      fn();
      window.scrollTo({top:0});
      setWipePhase('in');
      setTimeout(()=>setWipeActive(false),400);
    },300);
  },[]);

  // ── Tab navigation ──
  const handleTabChange = useCallback((tab)=>{
    wipeNavigate(()=>{
      setPage(null); setActiveTab(tab);
      setTimeout(()=>{
        const el=document.getElementById(`section-${tab.toLowerCase()}`);
        if(!el)return;
        const navH=isMobile?MOBILE_NAV_HEIGHT:DESKTOP_NAV_HEIGHT;
        window.scrollTo({top:el.offsetTop-navH,behavior:'smooth'});
      },80);
    });
  },[wipeNavigate,isMobile]);

  // ── Activity card click ──
  const handleNavigate = useCallback((type,activityTitle)=>{
    if(type==='activity'){
      wipeNavigate(()=>setPage({type:'activity',activityKey:activityTitle}));
    }
  },[wipeNavigate]);

  // ── Event card click ──
  const handleSelectEvent = useCallback((event)=>{
    wipeNavigate(()=>setPage(prev=>({...prev,type:'event',event})));
  },[wipeNavigate]);

  // ── Back from event ──
  const handleBackToActivity = useCallback(()=>{
    wipeNavigate(()=>setPage(prev=>({type:'activity',activityKey:prev.activityKey})));
  },[wipeNavigate]);

  // ── Back from activity ──
  const handleBackToMain = useCallback(()=>{
    wipeNavigate(()=>{
      setPage(null);
      setTimeout(()=>{
        const el=document.getElementById('section-activities');
        if(!el)return;
        const navH=isMobile?MOBILE_NAV_HEIGHT:DESKTOP_NAV_HEIGHT;
        window.scrollTo({top:el.offsetTop-navH,behavior:'smooth'});
      },80);
    });
  },[wipeNavigate,isMobile]);

  const navH=isMobile?MOBILE_NAV_HEIGHT:DESKTOP_NAV_HEIGHT;
  const currentActivity=page?.activityKey?activityPages[page.activityKey]:null;

  return (
    <>
      <div id="scroll-progress" />
      <CursorGlow />
      <WipeTransition active={wipeActive} phase={wipePhase} />

      {/* Splash */}
      {!splashDone&&(
        <div className={`splash-screen${splashFading?' fade-out':''}`}>
          <img src={nexasphereLogo} alt="NexaSphere" className="splash-logo" />
          <div className="splash-brand animated-gradient-text">NexaSphere</div>
          <div className="splash-spinner" />
        </div>
      )}

      <ParticleBackground />
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      <main style={{paddingTop:navH,position:'relative',zIndex:1}}>

        {/* Activity detail */}
        {page?.type==='activity'&&currentActivity&&(
          <PageEnter pageKey={`activity-${page.activityKey}`}>
            <ActivityDetailPage activity={currentActivity} onBack={handleBackToMain} onSelectEvent={handleSelectEvent} />
          </PageEnter>
        )}

        {/* Event detail */}
        {page?.type==='event'&&page.event&&currentActivity&&(
          <PageEnter pageKey={`event-${page.event.id}`}>
            <EventDetailPage event={page.event} activityColor={currentActivity.color} activityIcon={currentActivity.icon} onBack={handleBackToActivity} />
          </PageEnter>
        )}

        {/* Main page */}
        {!page&&(
          <PageEnter pageKey="main">
            <HeroSection onTabChange={handleTabChange} />
            <ActivitiesSection onNavigate={handleNavigate} />
            <EventsSection />
            <AboutSection />
            <TeamSection />
            <Footer />
          </PageEnter>
        )}
      </main>

      <button id="back-to-top" aria-label="Back to top">↑</button>
    </>
  );
}
