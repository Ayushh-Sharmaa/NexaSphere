import { useEffect, useRef, useState, useCallback } from 'react';
import nexasphereLogo from '../../assets/images/logos/nexasphere-logo.png';

const JOIN_MEMBER_FORM = 'https://forms.gle/NWb49scknwD6PP769';

/* ── Ripple Button ── */
function RippleBtn({ cls, children, href, onClick }) {
  const ref = useRef(null);
  const go = e => {
    const b = ref.current; if (!b) return;
    const r = b.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'rpl';
    el.style.left = (e.clientX - r.left) + 'px';
    el.style.top  = (e.clientY - r.top)  + 'px';
    b.appendChild(el);
    setTimeout(() => el.remove(), 700);
    onClick && onClick(e);
  };
  if (href) return <a ref={ref} href={href} target="_blank" rel="noopener noreferrer" className={`btn btn-ripple ${cls}`} onClick={go}>{children}</a>;
  return <button ref={ref} className={`btn btn-ripple ${cls}`} onClick={go}>{children}</button>;
}

/* ── Animated gradient title — safe in both modes ── */
function HeroTitle({ isLight }) {
  return (
    <div className="hero-title">
      <span className="hero-title-text">NexaSphere</span>
    </div>
  );
}

/* ── SVG Orbit rings ── */
function OrbitRings({ isLight }) {
  const rings = isLight
    ? [{rx:105,ry:48,dur:8,r:2,col:'194,119,10',d:'0s'},{rx:58,ry:182,dur:13,r:1.5,col:'109,40,217',d:'-5s'},{rx:162,ry:37,dur:17,r:1,col:'190,24,93',d:'-9s'},{rx:78,ry:158,dur:6,r:2,col:'8,145,178',d:'-2s'}]
    : [{rx:105,ry:48,dur:8,r:2,col:'0,212,255',d:'0s'},{rx:58,ry:182,dur:13,r:1.5,col:'123,111,255',d:'-5s'},{rx:162,ry:37,dur:17,r:1,col:'189,92,255',d:'-9s'},{rx:78,ry:158,dur:6,r:2,col:'0,255,157',d:'-2s'}];
  const tilts=['rotate(-22 250 250)','rotate(14 250 250)','rotate(55 250 250)','rotate(-35 250 250)'];
  return (
    <svg width="280" height="280" viewBox="0 0 500 500"
      style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',pointerEvents:'none',zIndex:0,overflow:'visible'}}>
      {rings.map((rg,i)=>(
        <g key={i} transform={tilts[i]}>
          <ellipse cx="250" cy="250" rx={rg.rx} ry={rg.ry} fill="none" stroke={`rgba(${rg.col},.18)`} strokeWidth="1"/>
          <circle r={rg.r*3.5} fill={`rgba(${rg.col},.95)`}
            style={{filter:`drop-shadow(0 0 ${rg.r*5}px rgba(${rg.col},.9))`}}>
            <animateMotion dur={`${rg.dur}s`} repeatCount="indefinite" begin={rg.d}>
              <mpath href={`#hr${i}`}/>
            </animateMotion>
          </circle>
          <path id={`hr${i}`} d={`M ${250-rg.rx} 250 a ${rg.rx} ${rg.ry} 0 1 1 ${rg.rx*2} 0 a ${rg.rx} ${rg.ry} 0 1 1 -${rg.rx*2} 0`} fill="none"/>
        </g>
      ))}
    </svg>
  );
}

/* ── Logo with 3D mouse tilt ── */
function Logo3D({ ready, isLight }) {
  const ref = useRef(null);
  const onMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - (rect.left+rect.width/2))/220;
    const dy = (e.clientY - (rect.top+rect.height/2))/220;
    el.style.transform = `perspective(700px) rotateX(${-dy*16}deg) rotateY(${dx*16}deg) scale(1.05)`;
  }, []);
  const onLeave = () => { if(ref.current) ref.current.style.transform=''; };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="hero-logo-wrap"
      style={{
        transformStyle:'preserve-3d',
        transition:'transform .14s ease',
        opacity:ready?1:0,
        transform:ready?'scale(1)':'scale(.3) rotateY(180deg)',
        transitionProperty:'opacity,transform',
        transitionDuration:'1s',
        transitionTimingFunction:'cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <OrbitRings isLight={isLight}/>
      <img src={nexasphereLogo} alt="NexaSphere" className="hero-logo-img"/>
      <div style={{position:'absolute',bottom:'-8px',left:'50%',transform:'translateX(-50%)',width:'52px',height:'10px',borderRadius:'50%',background:`radial-gradient(ellipse,${isLight?'rgba(0,0,0,.08)':'rgba(0,212,255,.18)'},transparent 70%)`,filter:'blur(4px)',animation:'float 5s ease-in-out infinite'}}/>
    </div>
  );
}

/* ── Stats bar ── */
function StatsBar({ vis, isLight }) {
  const items = [{v:'12',l:'Members',i:'👥'},{v:'8',l:'Activities',i:'⚡'},{v:'1',l:'Events Done',i:'📅'},{v:'∞',l:'Ideas',i:'💡'}];
  return (
    <div style={{
      display:'flex',maxWidth:'500px',margin:'40px auto 0',
      background: isLight ? 'rgba(28,25,23,.04)' : 'rgba(0,212,255,.03)',
      border:`1px solid ${isLight?'rgba(28,25,23,.09)':'rgba(0,212,255,.09)'}`,
      borderRadius:'14px',overflow:'hidden',
      opacity:vis?1:0,transform:vis?'none':'translateY(22px)',
      transition:'all .85s cubic-bezier(.22,1,.36,1)',transitionDelay:'.4s',
    }}>
      {items.map((s,i)=>(
        <div key={i} style={{
          flex:1,padding:'13px 6px',textAlign:'center',cursor:'default',
          borderRight:i<3?`1px solid ${isLight?'rgba(28,25,23,.07)':'rgba(0,212,255,.08)'}`:'none',
          transition:'background .2s',
        }}
          onMouseEnter={e=>e.currentTarget.style.background=isLight?'rgba(28,25,23,.06)':'rgba(0,212,255,.07)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        >
          <div style={{fontSize:'.9rem',marginBottom:'2px'}}>{s.i}</div>
          <div style={{
            fontFamily:'Orbitron,monospace',fontSize:'clamp(1.1rem,3vw,1.75rem)',fontWeight:900,
            backgroundImage:isLight?'linear-gradient(135deg,#c2770a,#6d28d9)':'linear-gradient(135deg,#00d4ff,#7b6fff)',
            WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',
            animation:vis?`countUp .5s ${.4+i*.1}s both`:'none',
          }}>{s.v}</div>
          <div style={{fontSize:'.58rem',color:isLight?'#57534e':'var(--t2)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:'1px',fontFamily:"'Space Mono',monospace"}}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Particles / atmosphere ── */
function Atmosphere({ isLight }) {
  if (isLight) return (
    <div style={{position:'absolute',inset:0,zIndex:0,pointerEvents:'none',
      backgroundImage:`radial-gradient(circle at 60% 38%,rgba(194,119,10,.05) 0%,transparent 55%),radial-gradient(circle at 30% 68%,rgba(109,40,217,.04) 0%,transparent 48%)`}}/>
  );
  return (
    <>
      {/* Binary rain */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:0,pointerEvents:'none'}}>
        {Array.from({length:9},(_,i)=>(
          <div key={i} style={{position:'absolute',left:`${6+i*11}%`,top:0,fontFamily:"'Space Mono',monospace",fontSize:'8px',color:'var(--c1)',lineHeight:1.9,userSelect:'none',animation:`dataStream ${4.2+i*.65}s linear infinite`,animationDelay:`${-i*1.3}s`,opacity:.06}}>
            {Array.from({length:28},()=>Math.random()>.5?'1':'0').join('\n')}
          </div>
        ))}
      </div>
      {/* Scanline */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:1,pointerEvents:'none'}}>
        <div style={{position:'absolute',left:0,right:0,height:'1px',background:'linear-gradient(90deg,transparent,rgba(0,212,255,.38),rgba(123,111,255,.38),transparent)',animation:'scanline 8s linear infinite'}}/>
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,.005) 2px,rgba(0,212,255,.005) 4px)'}}/>
      </div>
    </>
  );
}

export default function HeroSection({ onTabChange, theme = 'dark' }) {
  const [ready, setReady]     = useState(false);
  const [statsVis, setStatsVis] = useState(false);
  const isLight = theme === 'light';

  useEffect(() => {
    const t1 = setTimeout(()=>setReady(true), 80);
    const t2 = setTimeout(()=>setStatsVis(true), 900);
    return ()=>{ clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <section className="hero-section" id="section-home">
      {/* BG — nexasphere logo as hero bg */}
      <div style={{
        position:'absolute',inset:0,zIndex:0,
        backgroundImage:`url(${nexasphereLogo})`,
        backgroundSize:'55%',backgroundPosition:'center',backgroundRepeat:'no-repeat',
        filter: isLight
          ? 'brightness(.55) saturate(2.2) hue-rotate(220deg) opacity(0.22)'
          : 'brightness(.08) saturate(1.2)',
        transform:'scale(1.04)',
      }}/>
      <div className="hero-overlay"/>
      <Atmosphere isLight={isLight}/>

      <div className="hero-content" style={{position:'relative',zIndex:2,paddingBottom:'80px'}}>
        <Logo3D ready={ready} isLight={isLight}/>
        <HeroTitle isLight={isLight}/>

        <p className="hero-tagline" style={{
          animationName:'letterDrop',animationDuration:'.75s',animationDelay:'.5s',
          animationFillMode:'both',animationTimingFunction:'cubic-bezier(.22,1,.36,1)',opacity:0,
        }}>
          GL Bajaj&apos;s Student-Driven Tech Ecosystem
          <span style={{animation:'blink 1s step-end infinite',color:'var(--c1)',marginLeft:'2px'}}>_</span>
        </p>

        <div className="hero-buttons" style={{
          animationName:'letterDrop',animationDuration:'.75s',animationDelay:'.75s',
          animationFillMode:'both',animationTimingFunction:'cubic-bezier(.22,1,.36,1)',opacity:0,
          flexDirection:'column',alignItems:'center',gap:'10px',
        }}>
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center'}}>
            <RippleBtn cls="btn-primary" href={JOIN_MEMBER_FORM}>🚀 Join as Member</RippleBtn>
            <RippleBtn cls="btn-outline" onClick={()=>onTabChange('Team')}>👥 Core Team</RippleBtn>
          </div>
          {/* Core Team CTA */}
          <div style={{
            marginTop:'6px',padding:'14px 24px',
            background: isLight ? 'rgba(109,40,217,.05)' : 'rgba(123,111,255,.07)',
            border:`1px solid ${isLight?'rgba(109,40,217,.2)':'rgba(123,111,255,.2)'}`,
            borderRadius:'16px',maxWidth:'420px',textAlign:'center',
          }}>
            <p style={{fontSize:'.82rem',color:'var(--t2)',marginBottom:'10px',lineHeight:1.5}}>
              🚀 Want to be part of the NexaSphere Core Team?
            </p>
            <RippleBtn cls="btn-join" onClick={()=>onTabChange('Apply')}>✨ Apply for Core Team Here</RippleBtn>
          </div>
        </div>

        <StatsBar vis={statsVis} isLight={isLight}/>
      </div>

      {/* Bottom fade */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'150px',background:'linear-gradient(to bottom,transparent,var(--bg))',pointerEvents:'none',zIndex:2}}/>
      {/* Scroll indicator — sits inside bottom fade */}
      <div style={{position:'absolute',bottom:'16px',left:'50%',transform:'translateX(-50%)',zIndex:2,display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',opacity:.42,animation:'float 2.5s ease-in-out infinite'}}>
        <div style={{fontSize:'.56rem',color:isLight?'#78716c':'var(--t2)',letterSpacing:'.22em',fontFamily:"'Space Mono',monospace"}}>SCROLL</div>
        <div style={{width:'1px',height:'28px',background:`linear-gradient(to bottom,var(--c1),transparent)`}}/>
      </div>
    </section>
  );
}
