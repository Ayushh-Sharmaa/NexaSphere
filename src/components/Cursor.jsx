import { useEffect, useRef } from 'react';

export default function Cursor() {
  const orbRef = useRef(null);
  const trailRef = useRef(null);
  const glowRef = useRef(null);
  const stateRef = useRef({
    mx: 0,
    my: 0,
    ox: 0,
    oy: 0,
    floatY: 0,
    floatPhase: 0,
    hovering: false,
    clicking: false,
    raf: null
  });

  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    document.body.style.cursor = 'none';

    const s = stateRef.current;

    const onMove = e => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };

    const onOver = e => {
      s.hovering = !!(e.target.closest('button,a,[role="button"],[tabindex]'));
    };

    const tick = () => {
      s.ox += (s.mx - s.ox) * 0.18;
      s.oy += (s.my - s.oy) * 0.18;

      s.floatPhase += 0.022;
      s.floatY = Math.sin(s.floatPhase) * 6 +
        Math.sin(s.floatPhase * 1.7) * 3 +
        Math.sin(s.floatPhase * 0.5) * 4;

      const fy = s.oy + s.floatY;

      const scale = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.hovering ? 0.95 : 0.82;

      if (orbRef.current) {
        orbRef.current.style.left = s.ox + 'px';
        orbRef.current.style.top = fy + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
        orbRef.current.style.opacity = opacity;
      }
      if (trailRef.current) {
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.hovering ? 0 : 0.35;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
      }

      s.raf = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, {
      passive: true
    });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver, {
      passive: true
    });
    s.raf = requestAnimationFrame(tick);

    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
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
        position:'fixed', pointerEvents:'none', zIndex:10005,
        width:'18px', height:'18px', borderRadius:'50%',
        background:'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
        boxShadow:'0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
        transition:'transform .18s cubic-bezier(.34,1.56,.64,1), opacity .2s',
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
