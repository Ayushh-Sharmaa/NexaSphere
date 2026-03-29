import { useState, useEffect, useRef, useCallback } from 'react';
import './styles/globals.css';
import './styles/animations.css';
import './styles/components.css';

import ParticleBackground  from './shared/ParticleBackground';
import Navbar              from './shared/Navbar';
import HeroSection         from './pages/home/HeroSection';
import ActivitiesSection   from './pages/activities/ActivitiesSection';
import EventsSection       from './pages/events/EventsSection';
import AboutSection        from './pages/about/AboutSection';
import TeamSection         from './pages/team/TeamSection';
import Footer              from './shared/Footer';
import ActivityDetailPage  from './pages/activities/ActivityDetailPage';
import EventDetailPage     from './pages/events/EventDetailPage';
import CinematicOpening    from './shared/CinematicOpening';
import StormOverlay        from './shared/StormOverlay';
import ActivitiesPage      from './pages/activities/ActivitiesPage';
import EventsPage          from './pages/events/EventsPage';
import AboutPage           from './pages/about/AboutPage';
import TeamPage            from './pages/team/TeamPage';
import ContactPage         from './pages/contact/ContactPage';

import { activityPages }   from './data/activities/index';
import nexasphereLogo      from './assets/images/logos/nexasphere-logo.png';

const MNH = 88, DNH = 64;
const TABS = ['Home','Activities','Events','About','Team','Contact'];

/* ── Page wipe transition ── */
function Wipe({ on, ph }) {
  if (!on) return null;
  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:8000,background:'var(--bg)',animation:`${ph==='out'?'wipeDown .27s':'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'all'}}/>
      <div style={{position:'fixed',inset:0,zIndex:8001,background:'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',opacity:.07,animation:`${ph==='out'?'wipeDown .20s .04s':'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'none'}}/>
      {ph==='out'&&<div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:8002,pointerEvents:'none',opacity:0,animation:'splashIn .16s .1s ease forwards'}}>
        <img src={nexasphereLogo} style={{height:'46px',mixBlendMode:'screen',filter:'drop-shadow(0 0 12px var(--c1))',opacity:.6}} alt=""/>
      </div>}
    </>
  );
}

/* ── Page enter animation ── */
function PageIn({ children, k }) {
  const [r, setR] = useState(false);
  useEffect(()=>{ const raf=requestAnimationFrame(()=>setR(true)); return()=>cancelAnimationFrame(raf); },[k]);
  return (
    <div style={{opacity:r?1:0,transform:r?'none':'translateY(16px) scale(.99)',transition:'opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1)',willChange:'opacity,transform'}}>
      {children}
    </div>
  );
}

/* ── Anti-gravity orb cursor ── */
function Cursor() {
  const orbRef  = useRef(null);
  const trailRef= useRef(null);
  const glowRef = useRef(null);
  const stateRef= useRef({
    // real mouse position
    mx:0, my:0,
    // orb position (lags behind)
    ox:0, oy:0,
    // anti-gravity float offset
    floatY:0, floatPhase:0,
    // hover state
    hovering:false,
    clicking:false,
    raf:null
  });

  useEffect(()=>{
    if(window.matchMedia('(hover:none)').matches) return;
    document.body.style.cursor='none';

    const s = stateRef.current;

    const onMove = e => { s.mx = e.clientX; s.my = e.clientY; };
    const onDown = () => { s.clicking = true; };
    const onUp   = () => { s.clicking = false; };

    // Detect hoverable elements
    const onOver = e => {
      s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]'));
    };

    const tick = () => {
      // Smooth follow — increased sensitivity (was 0.11)
      s.ox += (s.mx - s.ox) * 0.18;
      s.oy += (s.my - s.oy) * 0.18;

      // Anti-gravity float: continuous gentle bob
      s.floatPhase += 0.022;
      s.floatY = Math.sin(s.floatPhase) * 6
               + Math.sin(s.floatPhase * 1.7) * 3
               + Math.sin(s.floatPhase * 0.5) * 4;

      const fy = s.oy + s.floatY;

      const scale = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.hovering ? 0.95 : 0.82;

      if (orbRef.current) {
        orbRef.current.style.left    = s.ox + 'px';
        orbRef.current.style.top     = fy  + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
        orbRef.current.style.opacity = opacity;
      }
      if (trailRef.current) {
        trailRef.current.style.left  = s.ox + 'px';
        trailRef.current.style.top   = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.hovering ? 0 : 0.35;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top  = s.my + 'px';
      }

      s.raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove,  { passive:true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('mouseover', onOver,  { passive:true });
    s.raf = requestAnimationFrame(tick);

    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('mouseover', onOver);
    };
  }, []);

  return (
    <>
      {/* Big ambient glow — follows mouse directly */}
      <div ref={glowRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:9990,
        width:'320px', height:'320px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(0,212,255,.055) 0%, rgba(123,111,255,.03) 40%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        transition:'opacity .3s',
      }}/>

      {/* Trail dot — slower, creates depth */}
      <div ref={trailRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:9992,
        width:'28px', height:'28px', borderRadius:'50%',
        background:'radial-gradient(circle, var(--c2) 0%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        filter:'blur(6px)',
        transition:'opacity .25s',
      }}/>

      {/* Main anti-gravity orb */}
      <div ref={orbRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:9995,
        width:'18px', height:'18px', borderRadius:'50%',
        background:'radial-gradient(circle at 35% 35%, #fff 0%, var(--c1) 40%, var(--c2) 100%)',
        boxShadow:'0 0 10px var(--c1), 0 0 24px rgba(0,212,255,.5), 0 0 50px rgba(123,111,255,.2)',
        transition:'transform .18s cubic-bezier(.34,1.56,.64,1), opacity .2s',
      }}>
        {/* Inner sparkle */}
        <div style={{
          position:'absolute', top:'20%', left:'22%',
          width:'5px', height:'5px', borderRadius:'50%',
          background:'rgba(255,255,255,.9)',
          filter:'blur(1px)',
        }}/>
      </div>
    </>
  );
}

export default function App() {
  const [cinDone,  setCinDone]  = useState(false);
  const [activeTab,setActiveTab]= useState('Home');
  const [mobile,   setMobile]   = useState(window.innerWidth<=768);
  const [wipeOn,   setWipeOn]   = useState(false);
  const [wipePh,   setWipePh]   = useState('out');
  const [page,     setPage]     = useState(null);
  const [theme,    setTheme]    = useState(()=>{
    const saved = localStorage.getItem('ns-theme');
    if (saved) return saved;
    // Fall back to OS / device preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [stormOn,  setStormOn]  = useState(false);
  const [stormTo,  setStormTo]  = useState('light');
  const stormLock = useRef(false);
  const themeRef  = useRef(theme); // always-current theme ref to avoid stale closures
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Apply theme to html element
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',theme);
    localStorage.setItem('ns-theme',theme);
  },[theme]);

  // Storm theme toggle — uses ref so never stale
  const triggerStorm = useCallback(() => {
    if (stormLock.current) return;
    stormLock.current = true;
    const nextTheme = themeRef.current === 'dark' ? 'light' : 'dark';
    setStormTo(nextTheme);
    setStormOn(true);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.classList.add('storm-spinning');
    // Safety fallback — unlock after 3s if onDone never fires
    setTimeout(() => {
      if (stormLock.current) {
        stormLock.current = false;
        setStormOn(false);
        const b = document.getElementById('theme-toggle');
        if (b) b.classList.remove('storm-spinning');
      }
    }, 3000);
  }, []);

  const onStormMidpoint = useCallback(() => {
    // Flip theme at storm peak using ref — never stale
    const nextTheme = themeRef.current === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, []);

  const onStormDone = useCallback(() => {
    setStormOn(false);
    stormLock.current = false;
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.classList.remove('storm-spinning');
  }, []);

  // Scroll progress bar
  useEffect(()=>{
    const bar=document.getElementById('scroll-progress');
    if(!bar)return;
    let ticking=false;
    const fn=()=>{
      if(!ticking){requestAnimationFrame(()=>{
        const s=window.scrollY,d=document.documentElement.scrollHeight-window.innerHeight;
        bar.style.width=d>0?`${(s/d)*100}%`:'0%';
        ticking=false;
      });ticking=true;}
    };
    window.addEventListener('scroll',fn,{passive:true});
    return()=>window.removeEventListener('scroll',fn);
  },[]);

  // Back to top button
  useEffect(()=>{
    const btn=document.getElementById('back-to-top');
    if(!btn)return;
    const fn=()=>btn.classList.toggle('visible',window.scrollY>400);
    window.addEventListener('scroll',fn,{passive:true});
    btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    return()=>window.removeEventListener('scroll',fn);
  },[]);

  // Active tab highlight from scroll
  useEffect(()=>{
    if(page)return;
    const nh=mobile?MNH:DNH;
    const fn=()=>{
      const sy=window.scrollY+nh+30;
      for(let i=TABS.length-1;i>=0;i--){
        const el=document.getElementById(`section-${TABS[i].toLowerCase()}`);
        if(el&&el.offsetTop<=sy){setActiveTab(TABS[i]);break;}
      }
    };
    window.addEventListener('scroll',fn,{passive:true});
    return()=>window.removeEventListener('scroll',fn);
  },[mobile,page]);

  // Resize
  useEffect(()=>{
    const fn=()=>setMobile(window.innerWidth<=768);
    window.addEventListener('resize',fn,{passive:true});
    return()=>window.removeEventListener('resize',fn);
  },[]);

  // Scroll reveal + cinematic pop + magnetic buttons + 3D card tilt
  useEffect(()=>{
    if(!cinDone)return;
    // Pop observer
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('fired');obs.unobserve(e.target);}
      });
    },{threshold:.09,rootMargin:'0px 0px -36px 0px'});
    document.querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num').forEach(el=>obs.observe(el));

    // Magnetic buttons
    const btns=document.querySelectorAll('.mag-btn');
    const onMove=e=>{
      btns.forEach(btn=>{
        const rect=btn.getBoundingClientRect();
        const dx=e.clientX-(rect.left+rect.width/2);
        const dy=e.clientY-(rect.top+rect.height/2);
        const d=Math.sqrt(dx*dx+dy*dy);
        btn.style.transform=d<88?`translate(${dx*(88-d)/88*.32}px,${dy*(88-d)/88*.32}px)`:'';
      });

      // 3D card tilt for activity cards
      document.querySelectorAll('.activity-card').forEach(card=>{
        const rect=card.getBoundingClientRect();
        const cx=rect.left+rect.width/2;
        const cy=rect.top+rect.height/2;
        const dx=e.clientX-cx;
        const dy=e.clientY-cy;
        const dist=Math.sqrt(dx*dx+dy*dy);
        const maxDist=Math.max(rect.width,rect.height)*0.9;
        if(dist<maxDist){
          const intensity=(1-dist/maxDist)*6;
          card.style.setProperty('--rx',(dx/rect.width*intensity).toFixed(2));
          card.style.setProperty('--ry',(-dy/rect.height*intensity).toFixed(2));
        } else {
          card.style.setProperty('--rx','0');
          card.style.setProperty('--ry','0');
        }
      });
    };
    window.addEventListener('mousemove',onMove,{passive:true});
    return()=>{obs.disconnect();window.removeEventListener('mousemove',onMove);};
  },[cinDone,page]);

  // Navigation with wipe transition
  const nav=useCallback((fn)=>{
    setWipeOn(true);setWipePh('out');
    setTimeout(()=>{
      fn();window.scrollTo({top:0});
      requestAnimationFrame(()=>{
        setWipePh('in');
        setTimeout(()=>setWipeOn(false),340);
      });
    },275);
  },[]);

  const onTab=useCallback(tab=>{
    // These tabs get their own dedicated page
    if(['Activities','Events','About','Team','Contact'].includes(tab)){
      nav(()=>{setPage({type:'section',section:tab});setActiveTab(tab);});
      return;
    }
    nav(()=>{
      setPage(null);setActiveTab(tab);
      setTimeout(()=>{
        const el=document.getElementById(`section-${tab.toLowerCase()}`);
        if(!el)return;
        window.scrollTo({top:el.offsetTop-(mobile?MNH:DNH),behavior:'smooth'});
      },50);
    });
  },[nav,mobile]);

  const onNavigate=useCallback((type,title)=>{
    if(type==='activity') nav(()=>setPage({type:'activity',activityKey:title}));
  },[nav]);

  const onEvent=useCallback(ev=>{
    nav(()=>setPage(p=>({...p,type:'event',event:ev})));
  },[nav]);

  const onKSSClick=useCallback(ev=>{
    // Show KSS event detail page with Insight Session as activity context
    nav(()=>setPage({type:'event',activityKey:'Insight Session',event:ev}));
  },[nav]);

  const onBackAct=useCallback(()=>{
    nav(()=>setPage(p=>({type:'activity',activityKey:p.activityKey})));
  },[nav]);

  const onBackMain=useCallback(()=>{
    nav(()=>{
      setPage(null);
      setTimeout(()=>{
        const el=document.getElementById('section-activities');
        if(!el)return;
        window.scrollTo({top:el.offsetTop-(mobile?MNH:DNH),behavior:'smooth'});
      },50);
    });
  },[nav,mobile]);

  const onBackToSection=useCallback((section)=>{
    nav(()=>setPage({type:'section',section}));
  },[nav]);

  const onBackHome=useCallback(()=>{
    nav(()=>{setPage(null);setActiveTab('Home');window.scrollTo({top:0});});
  },[nav]);

  const nh=mobile?MNH:DNH;
  const cur=page?.activityKey?activityPages[page.activityKey]:null;

  return (
    <>
      {/* Cinematic opening — plays once on load */}
      {!cinDone&&<CinematicOpening theme={theme} onDone={()=>setCinDone(true)}/>}

      <div id="scroll-progress"/>
      <Cursor/>
      <Wipe on={wipeOn} ph={wipePh}/>

      {/* Storm cinematic overlay */}
      {stormOn && (
        <StormOverlay
          toTheme={stormTo}
          onMidpoint={onStormMidpoint}
          onDone={onStormDone}
        />
      )}

      <button id="theme-toggle" className="mag-btn"
        onClick={triggerStorm}
        aria-label="Toggle theme" title={`Switch to ${theme==='dark'?'light':'dark'} mode`}>
        <span className="toggle-track">
          <span className="toggle-icon sun">☀️</span>
          <span className="toggle-thumb" />
          <span className="toggle-icon moon">🌙</span>
        </span>
      </button>

      {cinDone&&<ParticleBackground theme={theme}/>}
      <Navbar activeTab={activeTab} onTabChange={onTab}/>

      <main style={{paddingTop:nh,position:'relative',zIndex:1}}>
        {/* Section pages — navbar tab clicks */}
        {page?.type==='section'&&page.section==='Activities'&&(
          <PageIn k="pg-activities">
            <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome}/>
          </PageIn>
        )}
        {page?.type==='section'&&page.section==='Events'&&(
          <PageIn k="pg-events">
            <EventsPage onBack={onBackHome} onEventClick={onKSSClick}/>
          </PageIn>
        )}
        {page?.type==='section'&&page.section==='About'&&(
          <PageIn k="pg-about">
            <AboutPage onBack={onBackHome}/>
          </PageIn>
        )}
        {page?.type==='section'&&page.section==='Team'&&(
          <PageIn k="pg-team">
            <TeamPage onBack={onBackHome}/>
          </PageIn>
        )}
        {/* Activity detail pages */}
        {page?.type==='activity'&&cur&&(
          <PageIn k={`a-${page.activityKey}`}>
            <ActivityDetailPage activity={cur} onBack={()=>nav(()=>setPage({type:'section',section:'Activities'}))} onSelectEvent={onEvent}/>
          </PageIn>
        )}
        {page?.type==='event'&&page.event&&cur&&(
          <PageIn k={`e-${page.event?.id}`}>
            {(() => {
              // For KSS event from eventsData, use the corresponding conducted event from activity
              let displayEvent = page.event;
              if (page.activityKey === 'Insight Session' && page.event.id === 1) {
                // Find KSS #153 in conducted events
                displayEvent = cur.conductedEvents?.find(e => e.id === 'kss-153') || page.event;
              }
              return <EventDetailPage event={displayEvent} activityColor={cur.color} activityIcon={cur.icon} onBack={onBackAct}/>;
            })()}
          </PageIn>
        )}
        {/* Main home page */}

        {page?.type==='section' && page.section==='Contact' && (
          <PageIn k="pg-contact">
            <ContactPage onBack={onBackHome}/>
          </PageIn>
        )}
        {!page&&(
          <PageIn k="main">
            <HeroSection onTabChange={onTab} theme={theme}/>
            <ActivitiesSection onNavigate={onNavigate}/>
            <EventsSection onEventClick={onKSSClick}/>
            <AboutSection/>
            <TeamSection/>
            <Footer/>
          </PageIn>
        )}
      </main>

      <button id="back-to-top" aria-label="Back to top">↑</button>
    </>
  );
}
