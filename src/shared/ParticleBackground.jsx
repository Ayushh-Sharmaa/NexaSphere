import { useEffect, useRef } from 'react';

export default function ParticleBackground({ theme = 'dark' }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, mx=-9999, my=-9999;
    const isL = theme === 'light';

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize, { passive:true });
    const onMove = e => { mx=e.clientX; my=e.clientY; };
    window.addEventListener('mousemove', onMove, { passive:true });

    const N = Math.min(110, Math.floor(window.innerWidth/12));
    const hues = isL ? [38,272,330] : [192,262,165];
    const baseL = isL ? 48 : 70;
    const connA = isL ? .04 : .1;

    const pts = Array.from({length:N}, () => {
      const h = hues[Math.floor(Math.random()*hues.length)];
      const x = Math.random()*canvas.width, y = Math.random()*canvas.height;
      return { x, y, ox:x, oy:y, vx:(Math.random()-.5)*.3, vy:(Math.random()-.5)*.3, r:Math.random()*1.5+.3, h, a:Math.random()*.5+.15, ph:Math.random()*Math.PI*2 };
    });

    const draw = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      pts.forEach(p => {
        const dx=p.x-mx, dy=p.y-my, d=Math.sqrt(dx*dx+dy*dy);
        if (d<200&&d>0) {
          const f = d<75 ? (75-d)/75*1.6 : -(200-d)/200*.5;
          p.vx += (dx/d)*f*.012; p.vy += (dy/d)*f*.012;
        }
        p.vx += (p.ox-p.x)*.0004; p.vy += (p.oy-p.y)*.0004;
        p.vx *= .97; p.vy *= .97;
        p.x += p.vx; p.y += p.vy;
        if(p.x<0||p.x>canvas.width) p.vx*=-1;
        if(p.y<0||p.y>canvas.height) p.vy*=-1;
        p.ph += .015;
        const a = p.a*(.72+.28*Math.sin(p.ph));
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle=`hsla(${p.h},100%,${baseL}%,${a})`; ctx.fill();
        if(p.r>1) { ctx.beginPath(); ctx.arc(p.x,p.y,p.r*3.2,0,Math.PI*2); ctx.fillStyle=`hsla(${p.h},100%,${baseL}%,${a*.06})`; ctx.fill(); }
      });
      for(let i=0;i<pts.length;i++) {
        for(let j=i+1;j<pts.length;j++) {
          const dx=pts[i].x-pts[j].x, dy=pts[i].y-pts[j].y;
          const d=Math.sqrt(dx*dx+dy*dy);
          if(d<112) {
            ctx.beginPath(); ctx.strokeStyle=`hsla(${pts[i].h},100%,${baseL}%,${connA*(1-d/112)})`; ctx.lineWidth=.5;
            ctx.moveTo(pts[i].x,pts[i].y); ctx.lineTo(pts[j].x,pts[j].y); ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [theme]);

  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',zIndex:0,pointerEvents:'none',opacity:theme==='light'?.22:.48}}/>;
}
