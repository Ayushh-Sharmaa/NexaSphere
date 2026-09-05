import { useCallback, useEffect, useRef, useState } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';

const SHARDS = [
  { clip:'polygon(0 0,42% 0,28% 38%,0 22%)',           ox:'20%', oy:'10%', idx:0,  d:0   },
  { clip:'polygon(42% 0,68% 0,55% 32%,28% 38%)',        ox:'55%', oy:'5%',  idx:1,  d:30  },
  { clip:'polygon(68% 0,100% 0,100% 18%,72% 30%)',      ox:'85%', oy:'5%',  idx:2,  d:50  },
  { clip:'polygon(0 22%,28% 38%,18% 62%,0 52%)',        ox:'8%',  oy:'37%', idx:3,  d:60  },
  { clip:'polygon(28% 38%,55% 32%,72% 30%,78% 58%,60% 68%,22% 72%,18% 62%)', ox:'50%', oy:'50%', idx:4, d:80 },
  { clip:'polygon(100% 18%,100% 48%,80% 55%,72% 30%)',  ox:'92%', oy:'33%', idx:5,  d:55  },
  { clip:'polygon(0 52%,18% 62%,10% 88%,0 100%)',       ox:'5%',  oy:'75%', idx:6,  d:90  },
  { clip:'polygon(18% 62%,22% 72%,38% 100%,10% 88%)',   ox:'22%', oy:'80%', idx:7,  d:110 },
  { clip:'polygon(22% 72%,60% 68%,65% 100%,38% 100%)',  ox:'45%', oy:'88%', idx:8,  d:100 },
  { clip:'polygon(60% 68%,78% 58%,88% 85%,65% 100%)',   ox:'72%', oy:'85%', idx:9,  d:115 },
  { clip:'polygon(78% 58%,100% 48%,100% 100%,88% 85%)', ox:'90%', oy:'80%', idx:10, d:70  },
];

const EXITS = [
  ['-130%','-140%','-30deg'],
  ['0%',   '-160%', '10deg'],
  ['150%', '-125%', '24deg'],
  ['-160%','-25%', '-38deg'],
  ['0%',   '-5%',  '0deg'],   
  ['160%', '-18%', '40deg'],
  ['-148%','140%', '-28deg'],
  ['-65%', '158%', '-14deg'],
  ['-12%', '168%',  '6deg'],
  ['55%',  '162%',  '20deg'],
  ['150%', '138%',  '34deg'],
];

function IntroContent({ phase, count, tagline, accent, accent2, muted, grad, bg, isL, WORD }) {
  return (
    <div style={{
      position:'absolute', inset:0, background:bg,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      overflow:'hidden',
    }}>
      {!isL && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:`linear-gradient(rgba(204,17,17,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(204,17,17,.025) 1px,transparent 1px)`,
          backgroundSize:'50px 50px',
        }}/>
      )}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-58%)', width:'520px', height:'520px', borderRadius:'50%',
        background:`radial-gradient(circle,${isL?'rgba(204,17,17,.06)':'rgba(204,17,17,.07)'} 0%,transparent 70%)`,
        animation:'cinGlow 3s ease-in-out infinite',
      }}/>
      {[{t:26,l:26,bt:true,bl:true},{t:26,r:26,bt:true,br:true},{b:26,l:26,bb:true,bl:true},{b:26,r:26,bb:true,br:true}].map((c,i)=>(
        <div key={i} style={{
          position:'absolute',
          ...(c.t!==undefined?{top:c.t}:{}), ...(c.b!==undefined?{bottom:c.b}:{}),
          ...(c.l!==undefined?{left:c.l}:{}), ...(c.r!==undefined?{right:c.r}:{}),
          width:28, height:28,
          borderTop:    c.bt?`1.5px solid ${accent}`:'none',
          borderBottom: c.bb?`1.5px solid ${accent}`:'none',
          borderLeft:   c.bl?`1.5px solid ${accent}`:'none',
          borderRight:  c.br?`1.5px solid ${accent}`:'none',
          opacity: phase>=1 ? .55 : 0,
          transition:'opacity .5s ease',
        }}/>
      ))}
      <div style={{ marginBottom:'20px', opacity:phase>=1?1:0, animation:phase>=1?'cinLogoIn .75s cubic-bezier(.34,1.56,.64,1) both':'none' }}>
        <img src={nexasphereLogo} alt="NexaSphere" style={{
          width:'96px', height:'96px', objectFit:'contain',
          mixBlendMode: isL ? 'multiply' : 'screen',
          filter: isL
            ? 'saturate(1.5) contrast(1.2) drop-shadow(0 4px 16px rgba(204,17,17,.5)) brightness(1.05)'
            : 'brightness(1.8) saturate(1.5) drop-shadow(0 0 22px rgba(204,17,17,.8)) drop-shadow(0 0 44px rgba(136,0,0,.5))',
          animation: phase>=1 ? 'float 3s ease-in-out infinite' : 'none',
        }}/>
      </div>
      <div style={{
        display:'flex', gap:'1px', alignItems:'center',
        height:'1.25em', overflow:'visible', marginBottom:'13px',
        perspective:'600px', fontFamily:'Orbitron,monospace',
        fontSize:'clamp(2rem,6vw,4.2rem)', fontWeight:900, letterSpacing:'.15em',
        whiteSpace:'nowrap',
      }}>
        {WORD.split('').map((ch,li)=>(
          <span key={li} style={{
            display: li<count ? 'inline-block' : 'none',
            backgroundImage:grad,
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            animation:'cinLetterIn .48s cubic-bezier(.22,1,.36,1) both',
          }}>{ch}</span>
        ))}
        {count<WORD.length && phase>=2 && (
          <span style={{
            display:'inline-block', width:'2.5px', height:'.78em',
            background:accent, borderRadius:'1px',
            animation:'blink .5s step-end infinite', alignSelf:'center',
          }}/>
        )}
      </div>
      <div style={{
        fontFamily:"'Space Mono',monospace", fontSize:'.72rem',
        letterSpacing:'.22em', textTransform:'uppercase', color:muted,
        opacity:tagline?1:0, transform:tagline?'none':'translateY(10px)',
        transition:'all .55s ease', marginBottom:'4px',
        textShadow: isL ? 'none' : '0 0 12px rgba(255,255,255,.15)',
      }}>
        GL Bajaj Group of Institutions · Mathura
      </div>
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'2px',
        background:`linear-gradient(90deg,${accent},${accent2})`,
        transformOrigin:'left', animation:'cinProg 2.4s ease-out forwards',
      }}/>
    </div>
  );
}

export default function CinematicOpening({ onDone, theme = 'dark' }) {
  const [phase,    setPhase]    = useState(0);
  const [count,    setCount]    = useState(0);
  const [tagline,  setTagline]  = useState(false);
  const [cracking, setCracking] = useState(false);
  const [shatter,  setShatter]  = useState(false);
  const [gone,     setGone]     = useState(false);
  const countRef = useRef(0);
  const ivRef    = useRef(null);
  const timersRef = useRef([]);
  const WORD = 'NEXASPHERE';
  const isL  = theme === 'light';

  const handleSkip = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    clearInterval(ivRef.current);
    setGone(true);
    onDone();
  }, [onDone]);

  useEffect(() => {
    const ts = [];
    ts.push(setTimeout(() => setPhase(1), 280));
    ts.push(setTimeout(() => {
      setPhase(2);
      ivRef.current = setInterval(() => {
        countRef.current += 1;
        setCount(countRef.current);
        if (countRef.current >= WORD.length) clearInterval(ivRef.current);
      }, 70);
    }, 650));
    ts.push(setTimeout(() => setTagline(true),  1680));
    ts.push(setTimeout(() => setCracking(true), 2500));
    ts.push(setTimeout(() => setShatter(true),  2640));
    ts.push(setTimeout(() => { setGone(true); onDone(); }, 3380));
    timersRef.current = ts;
    return () => { ts.forEach(t => clearTimeout(t)); clearInterval(ivRef.current); };
  }, []);

  const bg      = isL ? '#FFFFFF' : '#0A0A0A';
  const accent  = isL ? '#CC1111' : '#CC1111';
  const accent2 = isL ? '#880000' : '#880000';
  const muted   = isL ? '#7A7A7A' : '#BEBEBE';
  const grad    = isL
    ? 'linear-gradient(135deg,#CC1111 0%,#880000 50%,#EE2222 100%)'
    : 'linear-gradient(135deg,#EE2222 0%,#CC1111 50%,#FF4444 100%)';

  if (gone) return null;

  const shardKeyframes = SHARDS.map((_, i) => {
    const [tx, ty, rot] = EXITS[i];
    return `@keyframes sf${i}{to{transform:translate(${tx},${ty}) rotate(${rot}) scale(0.7);opacity:0;}}`;
  }).join('\n');

  return (
    <>
      <style>{`
        @keyframes cinLetterIn { from{opacity:0;transform:translateY(-55px) rotateX(90deg) scale(.5)} to{opacity:1;transform:none} }
        @keyframes cinLogoIn   { from{opacity:0;transform:scale(.35) translateY(-22px)} to{opacity:1;transform:none} }
        @keyframes cinGlow     { 0%,100%{opacity:.3} 50%{opacity:.8} }
        @keyframes cinProg     { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        @keyframes crackIn     { 0%{opacity:0;stroke-width:0} 40%{opacity:1} 100%{opacity:.7} }
        @keyframes flashBurst  { 0%{opacity:0} 25%{opacity:.9} 100%{opacity:0} }
        @keyframes cinSkipIn   { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:none} }
        ${shardKeyframes}
      `}</style>

      {phase >= 1 && (
        <button
          onClick={handleSkip}
          aria-label="Skip intro"
          style={{
            position:'fixed', top:'22px', right:'24px', zIndex:10000,
            background:'rgba(204,17,17,0.12)', border:'1px solid rgba(204,17,17,0.35)',
            borderRadius:'20px', color: isL ? '#CC1111' : '#FF6666',
            fontFamily:"'Rajdhani',sans-serif", fontSize:'.78rem', fontWeight:700,
            letterSpacing:'.12em', textTransform:'uppercase', padding:'6px 16px',
            cursor:'pointer', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)',
            animation:'cinSkipIn .4s ease both', transition:'background .2s, border-color .2s',
          }}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(204,17,17,0.28)';e.currentTarget.style.borderColor='rgba(204,17,17,0.7)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(204,17,17,0.12)';e.currentTarget.style.borderColor='rgba(204,17,17,0.35)';}}
        >Skip →</button>
      )}

      <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }}>

        
        {SHARDS.map((s, i) => {
          const [tx, ty, rot] = EXITS[i];
          return (
            <div key={i} style={{
              position:'absolute', inset:0,
              clipPath: s.clip,
              transformOrigin: `${s.ox} ${s.oy}`,
              animation: shatter
                ? `sf${i} ${0.52 + (s.d / 1000) * 0.35}s cubic-bezier(.6,.05,.7,.2) ${s.d}ms both`
                : 'none',
              willChange:'transform,opacity',
            }}>
              <IntroContent {...{phase,count,tagline,accent,accent2,muted,grad,bg,isL,WORD}}/>

              
              <div style={{
                position:'absolute', inset:0, pointerEvents:'none',
                background:'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)',
                mixBlendMode:'screen',
              }}/>
            </div>
          );
        })}

        
        {!shatter && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"
            style={{
              position:'absolute', inset:0, width:'100%', height:'100%',
              opacity: cracking ? 1 : 0,
              transition:'opacity 0.05s',
              pointerEvents:'none', zIndex:2,
            }}>
            <defs>
              <filter id="cglow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <g stroke="rgba(238,80,80,0.95)" strokeWidth="0.22" fill="none" filter="url(#cglow)"
              style={{animation: cracking ? 'crackIn 0.14s ease forwards' : 'none'}}>
              <line x1="50" y1="50" x2="28"  y2="38"/>
              <line x1="50" y1="50" x2="55"  y2="32"/>
              <line x1="50" y1="50" x2="72"  y2="30"/>
              <line x1="50" y1="50" x2="78"  y2="58"/>
              <line x1="50" y1="50" x2="60"  y2="68"/>
              <line x1="50" y1="50" x2="22"  y2="72"/>
              <line x1="50" y1="50" x2="18"  y2="62"/>
              <line x1="28" y1="38" x2="0"   y2="22"/>
              <line x1="28" y1="38" x2="42"  y2="0"/>
              <line x1="55" y1="32" x2="68"  y2="0"/>
              <line x1="72" y1="30" x2="100" y2="18"/>
              <line x1="78" y1="58" x2="100" y2="48"/>
              <line x1="60" y1="68" x2="88"  y2="85"/>
              <line x1="60" y1="68" x2="65"  y2="100"/>
              <line x1="22" y1="72" x2="38"  y2="100"/>
              <line x1="22" y1="72" x2="10"  y2="88"/>
              <line x1="18" y1="62" x2="0"   y2="52"/>
            </g>
            <circle cx="50" cy="50" r="1.4" fill="rgba(238,80,80,1)" filter="url(#cglow)"/>
          </svg>
        )}

        
        {cracking && !shatter && (
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none', zIndex:3,
            background:'radial-gradient(circle at 50% 50%, rgba(238,80,80,0.55) 0%, transparent 55%)',
            animation:'flashBurst 0.18s ease forwards',
          }}/>
        )}
      </div>
    </>
  );
}

