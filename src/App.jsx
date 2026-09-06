import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from 'react-router-dom';
import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/chatbot.css';
import './styles/components.css';
import './styles/aurora.css';
import './styles/motion.css';

import ParticleBackground  from './shared/ParticleBackground';
import GeometricGridBackground from './shared/GeometricGridBackground';
import ScrollProgress      from './shared/ScrollProgress';
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
import Chatbot             from './shared/Chatbot';
import {
  AmbientOrbs, SectionDivider, PageFlash, BannerOrbs,
  useNsReveal, useHeroParallax,
  useNavScrollTint, useGlobalMouseParallax, useMagneticCards,
} from './shared/MotionLayer';
import ActivitiesPage      from './pages/activities/ActivitiesPage';
import EventsPage          from './pages/events/EventsPage';
import AboutPage           from './pages/about/AboutPage';
import TeamPage            from './pages/team/TeamPage';
import ContactPage         from './pages/contact/ContactPage';
import RecruitmentPage     from './pages/recruitment/RecruitmentPage';
import MembershipPage      from './pages/membership/MembershipPage';
import AdminApp            from './pages/admin/AdminApp';

import { activityPages }   from './data/activities/index';
import { events as fallbackEvents } from './data/eventsData';
import nexasphereLogo      from './assets/images/logos/nexasphere-logo.png';

const MNH = 88, DNH = 64;
const TABS = ['Home','Activities','Events','About','Team','Contact'];

/* ── Page wipe transition ── */
function Wipe({ on, ph }) {
  if (!on) return null;
  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:8000,background:'var(--bg)',animation:`${ph==='out'?'wipeDown .27s':'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'all'}}/>
      <div style={{position:'fixed',inset:0,zIndex:8001,background:'linear-gradient(90deg,#CC1111,#880000,#EE2222)',opacity:.09,animation:`${ph==='out'?'wipeDown .20s .04s':'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'none'}}/>
      
      {ph==='out'&&<div className="wipe-shimmer" aria-hidden="true"/>}
      
      {ph==='in'&&<PageFlash/>}
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
    
    mx:0, my:0,
    
    ox:0, oy:0,
    
    floatY:0, floatPhase:0,
    
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

    
    const onOver = e => {
      s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]'));
    };

    const tick = () => {
      
      s.ox += (s.mx - s.ox) * 1.00;
      s.oy += (s.my - s.oy) * 1.00;

      
      s.floatPhase += 0.022;
         s.floatY = Math.sin(s.floatPhase) * 2
         + Math.sin(s.floatPhase * 1.7) * 1
         + Math.sin(s.floatPhase * 0.5) * 1;

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
      
      <div ref={glowRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:10000,
        width:'320px', height:'320px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        transition:'opacity .3s',
      }}/>

      
      <div ref={trailRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:10002,
        width:'28px', height:'28px', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
        transform:'translate(-50%,-50%)',
        filter:'blur(6px)',
        transition:'opacity .25s',
      }}/>

      
      <div ref={orbRef} style={{
        position:'fixed', pointerEvents:'none', zIndex:100000,
        width:'18px', height:'18px', borderRadius:'50%',
        background:'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
        boxShadow:'0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
        transition:'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
      }}>
        
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

// Maps a URL pathname to the legacy internal "page" shape the section
// components expect, so their props/behavior stay unchanged.
function deriveTabFromPath(pathname) {
  if (pathname.startsWith('/activities')) return 'Activities';
  if (pathname.startsWith('/events')) return 'Events';
  if (pathname.startsWith('/about')) return 'About';
  if (pathname.startsWith('/team')) return 'Team';
  if (pathname.startsWith('/contact')) return 'Contact';
  return 'Home';
}

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  // Skip intro for returning visitors; set flag on first completion
  const [cinDone,  setCinDone]  = useState(() => {
    try { return Boolean(localStorage.getItem('ns_intro_seen')); } catch { return true; }
  });
  const [activeTab,setActiveTab]= useState(() => deriveTabFromPath(location.pathname));
  const [mobile,   setMobile]   = useState(window.innerWidth<=768);
  const [wipeOn,   setWipeOn]   = useState(false);
  const [wipePh,   setWipePh]   = useState('out');
  const [theme,    setTheme]    = useState(()=>localStorage.getItem('ns-theme')||'dark');
  const [eventsData,setEventsData]=useState(fallbackEvents);

  useEffect(() => {
    setActiveTab(deriveTabFromPath(location.pathname));
  }, [location.pathname]);
  
  useEffect(()=>{
    document.documentElement.setAttribute('data-theme',theme);
    localStorage.setItem('ns-theme',theme);
  },[theme]);

  
  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  useEffect(() => {
    let alive = true;
    const base = (import.meta?.env?.VITE_API_BASE || '').replace(/\/+$/, '');
    const url = base ? `${base}/api/content/events` : '/api/content/events';
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load dynamic events')))
      .then(data => {
        if (!alive) return;
        if (Array.isArray(data?.events) && data.events.length > 0) {
          setEventsData(data.events);
        }
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  
  useEffect(()=>{
    const btn=document.getElementById('back-to-top');
    if(!btn)return;
    const fn=()=>btn.classList.toggle('visible',window.scrollY>400);
    window.addEventListener('scroll',fn,{passive:true});
    btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    return()=>window.removeEventListener('scroll',fn);
  },[]);

  
  const isHome = location.pathname === '/' || location.pathname === '/home';

  useEffect(()=>{
    if(!isHome)return;
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
  },[mobile,isHome]);

  
  useEffect(()=>{
    const fn=()=>setMobile(window.innerWidth<=768);
    window.addEventListener('resize',fn,{passive:true});
    return()=>window.removeEventListener('resize',fn);
  },[]);

  
  useEffect(()=>{
    if(!cinDone)return;
    
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('fired');obs.unobserve(e.target);}
      });
    },{threshold:.09,rootMargin:'0px 0px -36px 0px'});
    document.querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-num').forEach(el=>obs.observe(el));

    
    const btns=document.querySelectorAll('.mag-btn');
    const onMove=e=>{
      btns.forEach(btn=>{
        const rect=btn.getBoundingClientRect();
        const dx=e.clientX-(rect.left+rect.width/2);
        const dy=e.clientY-(rect.top+rect.height/2);
        const d=Math.sqrt(dx*dx+dy*dy);
        btn.style.transform=d<88?`translate(${dx*(88-d)/88*.32}px,${dy*(88-d)/88*.32}px)`:'';
      });

      
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
  },[cinDone,location.pathname]);

  useNsReveal([cinDone, location.pathname]);
  useHeroParallax();
  useNavScrollTint();
  useGlobalMouseParallax();
  useMagneticCards();

  
  // Runs a URL change wrapped in the page-wipe transition.
  const nav=useCallback((to)=>{
    setWipeOn(true);setWipePh('out');
    setTimeout(()=>{
      navigate(to);window.scrollTo({top:0});
      requestAnimationFrame(()=>{
        setWipePh('in');
        setTimeout(()=>setWipeOn(false),340);
      });
    },275);
  },[navigate]);

  const onTab=useCallback(tab=>{
    if(['Activities','Events','About','Team','Contact'].includes(tab)){
      nav(`/${tab.toLowerCase()}`);
      return;
    }
    // "Home": if already on the home page, smooth-scroll to top instead of navigating.
    if(location.pathname === '/' || location.pathname === '/home'){
      window.scrollTo({top:0,behavior:'smooth'});
      setActiveTab('Home');
      return;
    }
    nav('/home');
  },[nav,location.pathname]);

  const onNavigate=useCallback((type,title)=>{
    if(type==='activity') nav(`/activities/${encodeURIComponent(title)}`);
  },[nav]);

  const onEvent=useCallback(ev=>{
    nav(`/events/${encodeURIComponent(ev?.id ?? '')}`);
  },[nav]);

  const onKSSClick=useCallback(ev=>{
    nav(`/events/${encodeURIComponent(ev?.id ?? '')}`);
  },[nav]);

  const onBackMain=useCallback(()=>{
    nav('/activities');
  },[nav]);

  const openApply = useCallback(()=>{
    nav('/recruitment');
  },[nav]);

  const openJoin = useCallback(()=>{
    nav('/membership');
  },[nav]);

  const onBackHome=useCallback(()=>{
    nav('/home');
  },[nav]);

  const nh=mobile?MNH:DNH;

  const activityKey = params.activityKey ? decodeURIComponent(params.activityKey) : null;
  const cur = activityKey ? activityPages[activityKey] : null;

  const eventIdParam = params.eventId;
  const currentEvent = useMemo(() => {
    if (eventIdParam == null) return null;
    return eventsData.find(e => String(e.id) === String(eventIdParam)) || null;
  }, [eventIdParam, eventsData]);

  const routeKey = location.pathname;

  return (
    <>
      {/* Move Chatbot to the very top to bypass all other logic */}
      <Chatbot /> 

      {!cinDone && <CinematicOpening theme={theme} onDone={() => {
        try { localStorage.setItem('ns_intro_seen', '1'); } catch {}
        setCinDone(true);
      }}/>}

      <ScrollProgress />
      <Cursor/>
      <Wipe on={wipeOn} ph={wipePh}/>

      <AmbientOrbs theme={theme}/>
      <GeometricGridBackground theme={theme} />
      <ParticleBackground theme={theme}/>
      <Navbar activeTab={activeTab} onTabChange={onTab} onToggleTheme={toggleTheme} theme={theme} onApply={openApply} onJoin={openJoin}/>

      <main style={{paddingTop:nh, position:'relative', zIndex:1}}>
        <PageIn k={routeKey}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={
              <>
                <HeroSection onTabChange={onTab} onApply={openApply} onJoin={openJoin} theme={theme}/>
                <SectionDivider/>
                <ActivitiesSection onNavigate={onNavigate}/>
                <SectionDivider/>
                <EventsSection onEventClick={onKSSClick} events={eventsData}/>
                <SectionDivider/>
                <AboutSection/>
                <SectionDivider/>
                <TeamSection onApply={openApply}/>
                <Footer/>
              </>
            }/>
            <Route path="/activities" element={<ActivitiesPage onNavigate={onNavigate} onBack={onBackHome}/>} />
            <Route path="/activities/:activityKey" element={
              cur
                ? <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent}/>
                : <NotFoundPage onGoHome={onBackHome}/>
            }/>
            <Route path="/events" element={<EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData}/>} />
            <Route path="/events/:eventId" element={
              currentEvent
                ? <EventDetailPage event={currentEvent} onBack={()=>nav('/events')}/>
                : <NotFoundPage onGoHome={onBackHome}/>
            }/>
            <Route path="/about" element={<AboutPage onBack={onBackHome}/>} />
            <Route path="/team" element={<TeamPage onBack={onBackHome} onApply={openApply}/>} />
            <Route path="/contact" element={<ContactPage onBack={onBackHome}/>} />
            <Route path="/membership" element={<MembershipPage onBack={onBackHome}/>} />
            <Route path="/recruitment" element={<RecruitmentPage onBack={onBackHome}/>} />
            <Route path="/apply" element={<Navigate to="/recruitment" replace />} />
            <Route path="/admin/*" element={<AdminApp/>} />
            <Route path="*" element={<NotFoundPage onGoHome={onBackHome}/>} />
          </Routes>
        </PageIn>
      </main>

      <button id="back-to-top" aria-label="Back to top">↑</button>
    </>
  );
}

export default function App() {
  return <AppShell />;
}

function NotFoundPage({ onGoHome }) {
  return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'40px 24px'}}>
      <div style={{fontFamily:"'Orbitron',monospace",fontSize:'clamp(5rem,18vw,10rem)',fontWeight:900,background:'linear-gradient(135deg,#CC1111 0%,#EE2222 50%,#FF4444 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',lineHeight:1,marginBottom:'16px'}}>404</div>
      <h2 style={{fontFamily:"'Orbitron',monospace",fontSize:'clamp(1rem,3vw,1.5rem)',fontWeight:700,color:'var(--t1)',marginBottom:'12px'}}>Page Not Found</h2>
      <p style={{color:'var(--t2)',fontSize:'1rem',maxWidth:'380px',lineHeight:1.7,marginBottom:'32px'}}>The page you&apos;re looking for doesn&apos;t exist or may have moved.</p>
      <button className="btn btn-primary" onClick={onGoHome} style={{cursor:'pointer'}}>← Go Home</button>
    </div>
  );
}
