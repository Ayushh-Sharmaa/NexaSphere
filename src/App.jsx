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
import CinematicOpening from './components/CinematicOpening';

import { activityPages } from './data/activities/index';
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';

const MNH = 88, DNH = 64;
const TABS = ['Home','Activities','Events','About','Team'];

/* ── Wipe transition ── */
function Wipe({ on, ph }) {
  if (!on) return null;
  return (
    <>
      <style>{`@keyframes wD{from{transform:scaleY(0);transform-origin:top}to{transform:scaleY(1);transform-origin:top}}@keyframes wU{from{transform:scaleY(1);transform-origin:bottom}to{transform:scaleY(0);transform-origin:bottom}}`}</style>
      <div style={{position:'fixed',inset:0,zIndex:8000,background:'var(--bg)',animation:`${ph==='out'?'wD .28s':'wU .32s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'all'}}/>
      <div style={{position:'fixed',inset:0,zIndex:8001,background:'linear-gradient(90deg,var(--c1),var(--c2),var(--c3))',opacity:.09,animation:`${ph==='out'?'wD .22s .04s':'wU .26s .04s'} cubic-bezier(.77,0,.18,1) forwards`,pointerEvents:'none'}}/>
      {ph==='out' && (
        <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:8002,pointerEvents:'none',opacity:0,animation:'splashIn .18s .12s ease forwards'}}>
          <img src={nexasphereLogo} style={{height:'50px',mixBlendMode:'screen',filter:'drop-shadow(0 0 14px var(--c1))',opacity:.65}} alt=""/>
        </div>
      )}
    </>
  );
}

/* ── Page enter ── */
function PageIn({ children, k }) {
  const [r, setR] = useState(false);
  useEffect(() => { const raf = requestAnimationFrame(()=>setR(true)); return ()=>cancelAnimationFrame(raf); }, [k]);
  return (
    <div style={{opacity:r?1:0,transform:r?'none':'translateY(18px) scale(.99)',transition:'opacity .45s cubic-bezier(.22,1,.36,1),transform .45s cubic-bezier(.22,1,.36,1)',willChange:'opacity,transform'}}>
      {children}
    </div>
  );
}

/* ── Dual cursor ── */
function Cursor() {
  const blob = useRef(null), dot = useRef(null);
  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    let x=0,y=0,tx=0,ty=0,raf;
    const mv = e => { tx=e.clientX; ty=e.clientY; };
    const tick = () => {
      x += (tx-x)*.09; y += (ty-y)*.09;
      if (blob.current) { blob.current.style.left=x+'px'; blob.current.style.top=y+'px'; }
      if (dot.current)  { dot.current.style.left=tx+'px';  dot.current.style.top=ty+'px'; }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove',mv,{passive:true});
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener('mousemove',mv); cancelAnimationFrame(raf); };
  }, []);
  return (
    <>
      <div ref={blob} style={{position:'fixed',pointerEvents:'none',zIndex:0,width:'400px',height:'400px',borderRadius:'50%',background:'radial-gradient(circle,rgba(0,229,255,.035) 0%,transparent 70%)',transform:'translate(-50%,-50%)'}}/>
      <div ref={dot} style={{position:'fixed',pointerEvents:'none',zIndex:1,width:'5px',height:'5px',borderRadius:'50%',background:'var(--c1)',opacity:.85,transform:'translate(-50%,-50%)',boxShadow:'0 0 10px rgba(0,229,255,.9)'}}/>
    </>
  );
}

export default function App() {
  const [cinDone,    setCinDone]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('Home');
  const [mobile,     setMobile]     = useState(window.innerWidth<=768);
  const [wipeOn,     setWipeOn]     = useState(false);
  const [wipePh,     setWipePh]     = useState('out');
  const [page,       setPage]       = useState(null);
  const [theme,      setTheme]      = useState(() => localStorage.getItem('ns-theme')||'dark');

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ns-theme', theme);
  }, [theme]);

  // Scroll progress
  useEffect(() => {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;
    let ticking = false;
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const s=window.scrollY,d=document.documentElement.scrollHeight-window.innerHeight;
          bar.style.width = d>0 ? `${(s/d)*100}%` : '0%';
          ticking=false;
        });
        ticking=true;
      }
    };
    window.addEventListener('scroll',fn,{passive:true});
    return ()=>window.removeEventListener('scroll',fn);
  },[]);

  // Back to top
  useEffect(()=>{
    const btn=document.getElementById('back-to-top');
    if(!btn)return;
    const fn=()=>btn.classList.toggle('visible',window.scrollY>400);
    window.addEventListener('scroll',fn,{passive:true});
    btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
    return()=>window.removeEventListener('scroll',fn);
  },[]);

  // Active tab from scroll
  useEffect(()=>{
    if(page)return;
    const nh=mobile?MNH:DNH;
    const fn=()=>{
      const sy=window.scrollY+nh+28;
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

  // Scroll reveal + cinematic pop + magnetic buttons
  useEffect(()=>{
    if(!cinDone)return;
    // Legacy reveal
    const obs1=new IntersectionObserver(
      e=>e.forEach(x=>{if(x.isIntersecting)x.target.classList.add('visible');}),
      {threshold:.07,rootMargin:'0px 0px -36px 0px'}
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.reveal-flip').forEach(el=>obs1.observe(el));
    // Cinematic pop
    const obs2=new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){e.target.classList.add('fired');obs2.unobserve(e.target);}
      });
    },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.pop-in,.pop-left,.pop-right,.pop-scale,.pop-flip,.pop-word,.pop-clip,.pop-num').forEach(el=>obs2.observe(el));
    // Magnetic buttons
    const btns=document.querySelectorAll('.mag-btn');
    const onMove=e=>{
      btns.forEach(btn=>{
        const rect=btn.getBoundingClientRect();
        const dx=e.clientX-(rect.left+rect.width/2);
        const dy=e.clientY-(rect.top+rect.height/2);
        const d=Math.sqrt(dx*dx+dy*dy);
        btn.style.transform = d<90 ? `translate(${dx*(90-d)/90*.35}px,${dy*(90-d)/90*.35}px)` : '';
      });
    };
    window.addEventListener('mousemove',onMove,{passive:true});
    return()=>{obs1.disconnect();obs2.disconnect();window.removeEventListener('mousemove',onMove);};
  },[cinDone,page]);

  const nav = useCallback((fn)=>{
    setWipeOn(true); setWipePh('out');
    setTimeout(()=>{
      fn(); window.scrollTo({top:0});
      requestAnimationFrame(()=>{
        setWipePh('in');
        setTimeout(()=>setWipeOn(false),370);
      });
    },285);
  },[]);

  const onTab = useCallback(tab=>{
    nav(()=>{
      setPage(null); setActiveTab(tab);
      setTimeout(()=>{
        const el=document.getElementById(`section-${tab.toLowerCase()}`);
        if(!el)return;
        window.scrollTo({top:el.offsetTop-(mobile?MNH:DNH),behavior:'smooth'});
      },55);
    });
  },[nav,mobile]);

  const onNavigate = useCallback((type,title)=>{
    if(type==='activity') nav(()=>setPage({type:'activity',activityKey:title}));
  },[nav]);

  const onEvent = useCallback(ev=>{
    nav(()=>setPage(p=>({...p,type:'event',event:ev})));
  },[nav]);

  const onBackAct = useCallback(()=>{
    nav(()=>setPage(p=>({type:'activity',activityKey:p.activityKey})));
  },[nav]);

  const onBackMain = useCallback(()=>{
    nav(()=>{
      setPage(null);
      setTimeout(()=>{
        const el=document.getElementById('section-activities');
        if(!el)return;
        window.scrollTo({top:el.offsetTop-(mobile?MNH:DNH),behavior:'smooth'});
      },55);
    });
  },[nav,mobile]);

  const nh=mobile?MNH:DNH;
  const cur=page?.activityKey?activityPages[page.activityKey]:null;

  return (
    <>
      {/* Cinematic opening — plays once on first load */}
      {!cinDone && <CinematicOpening theme={theme} onDone={()=>setCinDone(true)}/>}

      <div id="scroll-progress"/>
      <Cursor/>
      <Wipe on={wipeOn} ph={wipePh}/>

      {/* Theme toggle */}
      <button id="theme-toggle" className="mag-btn" onClick={()=>setTheme(t=>t==='dark'?'light':'dark')}
        aria-label="Toggle theme" title={`Switch to ${theme==='dark'?'light':'dark'} mode`}
        style={{fontSize:'1.1rem'}}>
        {theme==='dark' ? '☀️' : '🌙'}
      </button>

      {cinDone && <ParticleBackground theme={theme}/>}
      <Navbar activeTab={activeTab} onTabChange={onTab}/>

      <main style={{paddingTop:nh,position:'relative',zIndex:1}}>
        {page?.type==='activity'&&cur&&(
          <PageIn k={`a-${page.activityKey}`}>
            <ActivityDetailPage activity={cur} onBack={onBackMain} onSelectEvent={onEvent}/>
          </PageIn>
        )}
        {page?.type==='event'&&page.event&&cur&&(
          <PageIn k={`e-${page.event.id}`}>
            <EventDetailPage event={page.event} activityColor={cur.color} activityIcon={cur.icon} onBack={onBackAct}/>
          </PageIn>
        )}
        {!page&&(
          <PageIn k="main">
            <HeroSection onTabChange={onTab} theme={theme}/>
            <ActivitiesSection onNavigate={onNavigate}/>
            <EventsSection/>
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
