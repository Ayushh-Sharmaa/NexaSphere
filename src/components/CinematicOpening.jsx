import { useEffect, useState } from 'react';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';

/* ────────────────────────────────────────────
   CINEMATIC OPENING SCREEN
   Inspired by hacknovate07 — full dramatic entrance
   Phases:
   0: black → logo drops in
   1: "NEXASPHERE" letters fall in one by one
   2: tagline fades up
   3: full reveal wipe upward → done
──────────────────────────────────────────── */
export default function CinematicOpening({ onDone, theme = 'dark' }) {
  const [phase, setPhase]     = useState(0);
  const [letters, setLetters] = useState([]);
  const [tagline, setTagline] = useState(false);
  const [wiping,  setWiping]  = useState(false);
  const [gone,    setGone]    = useState(false);

  const WORD = 'NEXASPHERE';
  const isLight = theme === 'light';

  useEffect(() => {
    // Phase 0 → logo appears
    const t0 = setTimeout(() => setPhase(1), 400);

    // Phase 1 → letters drop in one by one
    const t1 = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        setLetters(prev => [...prev, WORD[i]]);
        i++;
        if (i >= WORD.length) clearInterval(iv);
      }, 80);
    }, 800);

    // Phase 2 → tagline
    const t2 = setTimeout(() => setTagline(true), 1900);

    // Phase 3 → start wipe exit
    const t3 = setTimeout(() => setWiping(true), 2800);

    // Phase 4 → fully gone
    const t4 = setTimeout(() => { setGone(true); onDone(); }, 3400);

    return () => [t0,t1,t2,t3,t4].forEach(clearTimeout);
  }, []);

  if (gone) return null;

  const bg = isLight ? '#faf8f5' : '#030508';
  const textGrad = isLight
    ? 'linear-gradient(270deg,#d97706,#7c3aed,#be185d,#d97706)'
    : 'linear-gradient(270deg,#00e5ff,#7c6eff,#bf5fff,#ff2d78,#00e5ff)';
  const accent = isLight ? '#d97706' : '#00e5ff';
  const muted  = isLight ? '#6b6660' : '#7a8db0';

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:bg,
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      overflow:'hidden',
      transition: wiping ? 'transform .65s cubic-bezier(.77,0,.18,1)' : 'none',
      transform: wiping ? 'translateY(-100%)' : 'translateY(0)',
    }}>
      {/* Subtle grid overlay — dark mode only */}
      {!isLight && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:`linear-gradient(rgba(0,229,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,.03) 1px,transparent 1px)`,
          backgroundSize:'48px 48px',
        }}/>
      )}

      {/* Ambient glow */}
      <div style={{
        position:'absolute', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)',
        width:'600px', height:'600px', borderRadius:'50%',
        background:`radial-gradient(circle,${isLight?'rgba(217,119,6,.06)':'rgba(0,229,255,.06)'} 0%,transparent 70%)`,
        pointerEvents:'none',
      }}/>

      {/* Corner brackets */}
      {[
        {top:32,left:32,bt:'border-top',bl:'border-left'},
        {top:32,right:32,bt:'border-top',bl:'border-right'},
        {bottom:32,left:32,bt:'border-bottom',bl:'border-left'},
        {bottom:32,right:32,bt:'border-bottom',bl:'border-right'},
      ].map((c,i)=>(
        <div key={i} style={{
          position:'absolute',
          top:c.top,bottom:c.bottom,
          left:c.left,right:c.right,
          width:'32px', height:'32px',
          [`border${c.bt.replace('border','')}`]:`1.5px solid ${accent}`,
          [`border${c.bl.replace('border','')}`]:`1.5px solid ${accent}`,
          opacity: phase >= 1 ? .5 : 0,
          transition:'opacity .5s ease',
          transitionDelay:`${i*0.08}s`,
        }}/>
      ))}

      {/* Scan line — dark only */}
      {!isLight && (
        <div style={{
          position:'absolute', top:0, left:0, right:0, height:'1px',
          background:`linear-gradient(90deg,transparent,${accent},transparent)`,
          opacity:.3,
          animation:'scanline 3s linear infinite',
        }}/>
      )}

      {/* Logo */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(.5) translateY(-40px)',
        transition:'all .8s cubic-bezier(.34,1.56,.64,1)',
        marginBottom:'24px',
        position:'relative',
      }}>
        <img
          src={nexasphereLogo}
          alt="NexaSphere"
          style={{
            width:'90px', height:'90px',
            objectFit:'contain',
            mixBlendMode: isLight ? 'multiply' : 'screen',
            filter: isLight
              ? 'drop-shadow(0 4px 16px rgba(0,0,0,.2))'
              : 'drop-shadow(0 0 28px rgba(0,229,255,.7)) drop-shadow(0 0 56px rgba(124,110,255,.4))',
            animation: phase >= 1 ? 'float 3s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* Letter-drop title */}
      <div style={{
        fontFamily:'Orbitron,monospace', fontSize:'clamp(2rem,7vw,4.5rem)',
        fontWeight:900, letterSpacing:'.18em', marginBottom:'14px',
        display:'flex', gap:'0',
        height:'1.2em', overflow:'hidden',
      }}>
        {letters.map((ch, i) => (
          <span key={i} style={{
            display:'inline-block',
            background:textGrad, backgroundSize:'300% 300%',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
            animation:'letterDrop .55s cubic-bezier(.22,1,.36,1) both, gradientShift 4s ease infinite',
            animationDelay:`0s, ${i*.06}s`,
          }}>{ch === ' ' ? '\u00A0' : ch}</span>
        ))}
        {/* Blinking cursor while typing */}
        {letters.length < WORD.length && (
          <span style={{
            display:'inline-block', width:'3px', height:'0.85em',
            background:accent, animation:'blink .6s step-end infinite',
            alignSelf:'center', marginLeft:'2px',
          }}/>
        )}
      </div>

      {/* Tagline */}
      <div style={{
        fontFamily:"'Space Mono',monospace", fontSize:'.72rem',
        letterSpacing:'.32em', textTransform:'uppercase',
        color:muted,
        opacity: tagline ? 1 : 0,
        transform: tagline ? 'none' : 'translateY(10px)',
        transition:'all .7s cubic-bezier(.22,1,.36,1)',
      }}>
        GL BAJAJ GROUP OF INSTITUTIONS · MATHURA
      </div>

      {/* Progress bar */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'2px',
        background:`linear-gradient(90deg,${isLight?'#d97706,#7c3aed':'#00e5ff,#7c6eff,#bf5fff'})`,
        transformOrigin:'left',
        animation:'progressBar 2.6s ease forwards',
      }}>
        <style>{`@keyframes progressBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
      </div>

      {/* Powered by label */}
      <div style={{
        position:'absolute', bottom:'16px',
        fontFamily:"'Space Mono',monospace", fontSize:'.55rem',
        letterSpacing:'.2em', textTransform:'uppercase', color:muted,
        opacity: tagline ? .5 : 0, transition:'opacity .5s .3s',
      }}>
        POWERED BY REACT + VITE
      </div>
    </div>
  );
}
