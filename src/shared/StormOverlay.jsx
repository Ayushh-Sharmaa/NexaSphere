import { useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════
   NEXASPHERE CINEMATIC STORM v5 — FULL CANVAS, ONE UNIFIED FLOW

   Everything rendered on a single canvas for maximum cohesion.

   Phase 1  ERUPT     (0–380ms)
     500 sand particles BLAST from all 4 corners simultaneously
     Thick amber flood fills screen from edges in
     Unmissable even on dark backgrounds

   Phase 2  COMPRESS  (380–720ms)
     All particles spiral VIOLENTLY toward center
     Black-hole pull effect — amber becomes incandescent at center
     Theme switches at 620ms (completely hidden)

   Phase 3  SINGULARITY (720–780ms)
     All matter collapses to a bright pinpoint at center
     Screen-wide white FLASH (2 frames)

   Phase 4  BANG      (780–1300ms)
     SUPERNOVA — shockwave ring explodes outward from center
     Full screen flooded with new theme color in 300ms
     Radial LIGHT RAYS burst from center (star burst)
     Chromatic aberration rings (RGB split)
     Debris particles scatter and fade

   Phase 5  SETTLE    (1300–2000ms)
     Rays fade, debris clears
     Canvas opacity → 0, real app visible
═══════════════════════════════════════════════════════════════ */

const N_GRAINS = 520;

function rand(a, b) { return a + Math.random() * (b - a); }
function ease(t)  { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function easeOut(t) { return 1-(1-t)**3; }
function easeIn(t)  { return t*t*t; }
function lerp(a,b,t){ return a+(b-a)*t; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

function spawnGrain(W, H, idx) {
  const zone = idx % 8;
  let x, y;
  switch (zone) {
    case 0: x=rand(-80,-5); y=rand(0,H*.5);   break;
    case 1: x=rand(-80,-5); y=rand(H*.5,H);   break;
    case 2: x=rand(W+5,W+80);y=rand(0,H*.5);  break;
    case 3: x=rand(W+5,W+80);y=rand(H*.5,H);  break;
    case 4: x=rand(0,W*.5); y=rand(-80,-5);   break;
    case 5: x=rand(W*.5,W); y=rand(-80,-5);   break;
    case 6: x=rand(0,W*.5); y=rand(H+5,H+80); break;
    default:x=rand(W*.5,W); y=rand(H+5,H+80);
  }
  const cx=W/2, cy=H/2;
  const toAngle = Math.atan2(cy-y + rand(-H*.2,H*.2), cx-x + rand(-W*.2,W*.2));
  const spd = rand(6, 16);
  const orbitDir = Math.random() > 0.5 ? 1 : -1;
  return {
    x, y, spawnX:x, spawnY:y,
    vx: Math.cos(toAngle)*spd, vy: Math.sin(toAngle)*spd,
    orbitAngle: Math.atan2(y-cy, x-cx),
    orbitDir,
    r:    rand(0.7, 3.2),
    hue:  rand(20, 52),
    sat:  rand(65, 98),
    lit:  rand(40, 78),
    a:    rand(0.5, 0.95),
    wave: rand(0, Math.PI*2),
    ws:   rand(0.05, 0.12),
    wa:   rand(1, 5),
    scatterA: Math.random()*Math.PI*2, 
    scatterSpd: rand(3, 18),
  };
}

export default function StormOverlay({ toTheme, onMidpoint, onDone }) {
  const canvasRef    = useRef(null);
  const midRef       = useRef(false);
  const doneRef      = useRef(false);
  const startTimeRef = useRef(null);
  
  const onMidpointRef = useRef(onMidpoint);
  const onDoneRef     = useRef(onDone);
  useEffect(() => { onMidpointRef.current = onMidpoint; }, [onMidpoint]);
  useEffect(() => { onDoneRef.current     = onDone;     }, [onDone]);

  const themeColors = {
    dark:  { bg:'#020509', r:2,   g:5,   b:9,   c1:[0,212,255],  c2:[123,111,255], c3:[189,92,255] },
    light: { bg:'#faf8f5', r:250, g:248, b:245, c1:[194,119,10], c2:[109,40,217],  c3:[190,24,93]  },
  };
  const target = themeColors[toTheme];

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    cvs.width  = window.innerWidth;
    cvs.height = window.innerHeight;
    const W=cvs.width, H=cvs.height, cx=W/2, cy=H/2;
    const DIAG = Math.sqrt(W*W+H*H);

    const grains = Array.from({ length:N_GRAINS }, (_,i) => spawnGrain(W,H,i));

    
    if (!startTimeRef.current) startTimeRef.current = performance.now();

    
    const T = {
      erupt:       0,
      compress:    380,
      singularity: 720,
      bang:        780,
      settle:      1300,
      done:        2000,
    };

    let raf;
    let canvasAlpha = 1;

    const draw = (now) => {
      const elapsed = now - startTimeRef.current;
      ctx.clearRect(0, 0, W, H);

      /* ── Determine phase ── */
      const ph =
        elapsed < T.compress    ? 'erupt'       :
        elapsed < T.singularity ? 'compress'    :
        elapsed < T.bang        ? 'singularity' :
        elapsed < T.settle      ? 'bang'        :
        elapsed < T.done        ? 'settle'      : 'done';

      if (ph === 'done') {
        if (!doneRef.current) { doneRef.current = true; onDoneRef.current(); }
        cancelAnimationFrame(raf);
        return;
      }

      /* ── Fire theme switch mid-storm ── */
      if (elapsed >= 620 && !midRef.current) {
        midRef.current = true;
        onMidpointRef.current();
      }

      /* ═══════════════════════════════════════
         PHASE 1: ERUPT (0–380ms)
         Amber flood + grains flying in from corners
      ═══════════════════════════════════════ */
      if (ph === 'erupt') {
        const t = elapsed / T.compress;
        const hazeA = easeOut(t) * 0.94;

        
        const bg = ctx.createRadialGradient(cx*.6,cy*.5,0, cx,cy,DIAG*.65);
        bg.addColorStop(0,   `rgba(225,145,38,${hazeA*0.85})`);
        bg.addColorStop(0.4, `rgba(188,108,22,${hazeA})`);
        bg.addColorStop(0.75,`rgba(148,78,12,${hazeA*0.95})`);
        bg.addColorStop(1,   `rgba(90,45,5,  ${hazeA*0.88})`);
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,W,H);

        
        if (t < 0.75) {
          [[0,0],[W,0],[0,H],[W,H]].forEach(([bx,by]) => {
            const g=ctx.createRadialGradient(bx,by,0,bx,by,DIAG*.52*easeOut(t));
            g.addColorStop(0,   `rgba(235,155,45,${0.82*(1-t*.5)})`);
            g.addColorStop(0.45,`rgba(185,102,18,${0.55*(1-t*.4)})`);
            g.addColorStop(1,   'rgba(0,0,0,0)');
            ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
          });
        }
      }

      /* ═══════════════════════════════════════
         PHASE 2: COMPRESS (380–720ms)
         Grains spiral in, incandescent core
      ═══════════════════════════════════════ */
      if (ph === 'compress') {
        const t = (elapsed - T.compress) / (T.singularity - T.compress);

        
        ctx.fillStyle = `rgba(172,90,12,${lerp(0.88,0.96,t)})`;
        ctx.fillRect(0,0,W,H);

        
        const coreR = lerp(380, 15, easeIn(t));
        const cg = ctx.createRadialGradient(cx,cy,0,cx,cy,coreR);
        cg.addColorStop(0,   `rgba(255,220,100,${easeIn(t)*0.95})`);
        cg.addColorStop(0.2, `rgba(255,160,40,${easeIn(t)*0.8})`);
        cg.addColorStop(0.6, `rgba(200,100,15,${easeIn(t)*0.5})`);
        cg.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      }

      /* ═══════════════════════════════════════
         PHASE 3: SINGULARITY (720–780ms)
         WHITE FLASH + total collapse
      ═══════════════════════════════════════ */
      if (ph === 'singularity') {
        const t = (elapsed - T.singularity) / (T.bang - T.singularity);
        
        ctx.fillStyle = `rgba(255,255,255,${ease(t)*0.98})`;
        ctx.fillRect(0,0,W,H);
      }

      /* ═══════════════════════════════════════
         PHASE 4: BANG (780–1300ms)
         SUPERNOVA — shockwave expands from center
         Fills screen with new theme color
      ═══════════════════════════════════════ */
      if (ph === 'bang') {
        const t = (elapsed - T.bang) / (T.settle - T.bang);
        const te = easeOut(t);

        
        const waveR = te * DIAG * 1.05;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, waveR, 0, Math.PI*2);
        ctx.fillStyle = `rgb(${target.r},${target.g},${target.b})`;
        ctx.fill();
        ctx.restore();

        
        if (t < 0.85) {
          const ringT = clamp(t, 0, 1);
          const ringR = ringT * DIAG * 1.05;
          const ringW = lerp(50, 8, ringT);
          const glow  = ctx.createRadialGradient(cx,cy,Math.max(0,ringR-ringW*1.5),cx,cy,ringR+4);
          glow.addColorStop(0, `rgba(${target.c1.join(',')},0)`);
          glow.addColorStop(0.5,`rgba(${target.c1.join(',')},${0.9*(1-t*.6)})`);
          glow.addColorStop(0.85,`rgba(${target.c2.join(',')},${0.7*(1-t*.5)})`);
          glow.addColorStop(1, `rgba(${target.c3.join(',')},0)`);
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, ringR+4, 0, Math.PI*2);
          ctx.arc(cx, cy, Math.max(0,ringR-ringW), 0, Math.PI*2, true);
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.restore();
        }

        
        if (t < 0.6) {
          const offset = 18 * (1-t);
          [[target.c1,'rgba(0,0,0,0)'], [target.c3,'rgba(0,0,0,0)']].forEach(([col], ci) => {
            const ox = ci===0? -offset : offset;
            const oy = ci===0?  offset : -offset;
            ctx.save();
            ctx.globalAlpha = 0.18*(1-t*1.5);
            ctx.beginPath();
            const cr2=waveR+offset*2; const cr1=Math.max(0,cr2-22);
            ctx.arc(cx+ox,cy+oy,cr2,0,Math.PI*2);
            ctx.arc(cx+ox,cy+oy,cr1,0,Math.PI*2,true);
            ctx.fillStyle=`rgb(${col.join(',')})`;
            ctx.fill();
            ctx.restore();
          });
        }

        
        const rays = 24;
        for (let i=0; i<rays; i++) {
          const angle = (i/rays)*Math.PI*2 + t;
          const len   = lerp(0, DIAG*.75, easeOut(t));
          const rayA  = (1-t)*0.22;
          if (rayA < 0.01) continue;
          ctx.save();
          ctx.translate(cx,cy);
          ctx.rotate(angle);
          const rg=ctx.createLinearGradient(0,0,len,0);
          rg.addColorStop(0,   `rgba(${target.c1.join(',')},${rayA})`);
          rg.addColorStop(0.5, `rgba(${target.c2.join(',')},${rayA*.6})`);
          rg.addColorStop(1,   'rgba(0,0,0,0)');
          ctx.beginPath();
          ctx.moveTo(0,-2+(i%3)); ctx.lineTo(len,-(1+i%2));
          ctx.strokeStyle=rg;
          ctx.lineWidth=lerp(4,1,t);
          ctx.stroke();
          ctx.restore();
        }

        
        const core = lerp(180, 20, easeOut(t));
        const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,core);
        cg.addColorStop(0,   `rgba(255,255,255,${0.95*(1-t)})`);
        cg.addColorStop(0.25,`rgba(${target.c1.join(',')},${0.8*(1-t)})`);
        cg.addColorStop(0.6, `rgba(${target.c2.join(',')},${0.4*(1-t)})`);
        cg.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle=cg; ctx.fillRect(0,0,W,H);
      }

      /* ═══════════════════════════════════════
         PHASE 5: SETTLE (1300–2000ms)
         Debris fades, canvas fades out
      ═══════════════════════════════════════ */
      if (ph === 'settle') {
        const t = (elapsed - T.settle) / (T.done - T.settle);
        
        ctx.fillStyle=`rgb(${target.r},${target.g},${target.b})`;
        ctx.fillRect(0,0,W,H);
        
        canvasAlpha = 1 - easeOut(t);
        if (cvs) cvs.style.opacity = canvasAlpha;

        
        const resG=ctx.createRadialGradient(cx,cy,0,cx,cy,DIAG*.45);
        resG.addColorStop(0, `rgba(${target.c1.join(',')},${(1-t)*0.28})`);
        resG.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle=resG; ctx.fillRect(0,0,W,H);
      }

      /* ═══════════════════════════════════════
         GRAINS — drawn in all phases
      ═══════════════════════════════════════ */
      grains.forEach((p, idx) => {
        p.wave += p.ws;

        if (ph === 'erupt') {
          const t = elapsed / T.compress;
          p.x += p.vx * lerp(1, 0.35, easeOut(t));
          p.y += p.vy * lerp(1, 0.35, easeOut(t));
          p.x += Math.sin(p.wave + idx) * p.wa * 0.5;
          p.y += Math.cos(p.wave + idx) * p.wa * 0.5;

        } else if (ph === 'compress') {
          const t = (elapsed - T.compress) / (T.singularity - T.compress);
          const pull = easeIn(t) * 0.2;
          p.vx += (cx - p.x) * pull;
          p.vy += (cy - p.y) * pull;
          p.vx *= 0.88; p.vy *= 0.88;
          p.orbitAngle += 0.05 * p.orbitDir * (1 + t*3);
          const orbitR = Math.sqrt((p.x-cx)**2+(p.y-cy)**2) * lerp(1, 0.02, t*t);
          p.x = lerp(p.x, cx + Math.cos(p.orbitAngle)*orbitR, t*0.35);
          p.y = lerp(p.y, cy + Math.sin(p.orbitAngle)*orbitR, t*0.35);
          p.a = lerp(p.a, 0, t * 0.6);

        } else if (ph === 'singularity') {
          
          p.x = lerp(p.x, cx, 0.4);
          p.y = lerp(p.y, cy, 0.4);
          p.a *= 0.7;

        } else if (ph === 'bang' || ph === 'settle') {
          const t = (elapsed - T.bang) / (T.done - T.bang);
          
          p.x += Math.cos(p.scatterA) * p.scatterSpd * easeOut(clamp(t*2,0,1));
          p.y += Math.sin(p.scatterA) * p.scatterSpd * easeOut(clamp(t*2,0,1));
          p.a = lerp(p.a, 0, 0.08 + t * 0.08);
          p.hue = lerp(p.hue, target.c1[0] ?? 192, 0.04); 
        }

        if (p.a < 0.04 || ph === 'singularity') {
          if (ph !== 'singularity') return;
        }

        
        const mAngle = ph==='compress'
          ? p.orbitAngle + Math.PI * 0.6 * p.orbitDir
          : ph==='bang'||ph==='settle'
            ? p.scatterA
            : Math.atan2(p.vy, p.vx);
        const stretchLen = ph==='bang' ? p.r*5 : ph==='compress' ? p.r*3.5 : p.r*3;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(mAngle);
        ctx.globalAlpha = clamp(p.a, 0, 1);
        ctx.beginPath();
        ctx.ellipse(0,0, stretchLen, p.r*0.55, 0, 0, Math.PI*2);
        ctx.fillStyle = `hsl(${p.hue},${p.sat}%,${p.lit}%)`;
        ctx.fill();
        ctx.restore();
      });

      
      if (ph === 'erupt') {
        const si = easeOut(elapsed / T.compress);
        for (let i=0; i<24; i++) {
          const y  = (H/24)*i + Math.sin(elapsed*.04+i*.8)*16;
          const ln = rand(120, 550);
          const sx = ((elapsed*(4+i%5)*7) % (W+ln*2)) - ln;
          const a  = (0.05 + Math.random()*.14)*si;
          const h  = rand(22, 48);
          const g  = ctx.createLinearGradient(sx,y,sx+ln,y);
          g.addColorStop(0,    `hsla(${h},82%,56%,0)`);
          g.addColorStop(0.35, `hsla(${h},82%,56%,${a})`);
          g.addColorStop(0.75, `hsla(${h},82%,56%,${a*.7})`);
          g.addColorStop(1,    `hsla(${h},82%,56%,0)`);
          ctx.strokeStyle=g;
          ctx.lineWidth=rand(.6,2.8);
          ctx.beginPath();
          ctx.moveTo(sx,y); ctx.lineTo(sx+ln,y);
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []); 

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0,
        width: '100%', height: '100%',
        zIndex: 9500, pointerEvents: 'none',
      }}
    />
  );
}

