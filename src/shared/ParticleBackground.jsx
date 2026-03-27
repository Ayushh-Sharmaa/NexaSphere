import { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────────
   Google Antigravity-style interactive particle dot network
   Light mode: dark dots on light bg — fully visible
   Dark mode : glowing cyan/purple dots on dark bg
───────────────────────────────────────────────────────────────── */

export default function ParticleBackground({ theme = 'dark' }) {
  const canvasRef = useRef(null);
  const themeRef  = useRef(theme);

  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let raf;
    let mx = -9999, my = -9999;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const onMove  = e => { mx = e.clientX; my = e.clientY; };
    const onTouch = e => {
      if (e.touches.length) { mx = e.touches[0].clientX; my = e.touches[0].clientY; }
    };
    const onLeave = () => { mx = -9999; my = -9999; };
    window.addEventListener('mousemove',  onMove,  { passive: true });
    window.addEventListener('touchmove',  onTouch, { passive: true });
    window.addEventListener('mouseleave', onLeave, { passive: true });

    const N            = Math.min(150, Math.floor(window.innerWidth / 9));
    const CONNECT_DIST = 130;
    const REPEL_DIST   = 85;
    const ATTRACT_DIST = 220;
    const HALO_DIST    = 200;

    const mkParticle = () => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      return {
        x, y, ox: x, oy: y,
        vx: (Math.random() - 0.5) * 0.38,
        vy: (Math.random() - 0.5) * 0.38,
        r:  Math.random() * 2.2 + 0.4,
        ph: Math.random() * Math.PI * 2,
        // dark hues: cyan/indigo/green; light hues: amber/violet/rose
        hue: [192, 262, 165, 300, 210][Math.floor(Math.random() * 5)],
        lhue:[30,  270, 330, 200, 0  ][Math.floor(Math.random() * 5)], // light-mode hues
      };
    };

    const pts = Array.from({ length: N }, mkParticle);

    const draw = () => {
      const isL = themeRef.current === 'light';

      /* ── theme-aware palette ── */
      // Dark mode: bright glowing dots on dark bg
      // Light mode: VERY dark vivid dots on light bg — must be clearly visible
      const dotL     = isL ? 20  : 72;   // lightness — very dark in light mode
      const dotSat   = isL ? 90  : 100;
      const dotA     = isL ? 0.85: 0.58; // much higher alpha in light mode
      const lineA    = isL ? 0.35 : 0.18; // thicker lines in light mode
      const haloA    = isL ? 0.30 : 0.15;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      pts.forEach(p => {
        const dx = p.x - mx, dy = p.y - my;
        const d  = Math.sqrt(dx * dx + dy * dy);

        // Repulsion
        if (d < REPEL_DIST && d > 0) {
          const f = ((REPEL_DIST - d) / REPEL_DIST) * 1.9;
          p.vx += (dx / d) * f * 0.019;
          p.vy += (dy / d) * f * 0.019;
        }
        // Attraction
        else if (d < ATTRACT_DIST && d > REPEL_DIST) {
          const f = ((ATTRACT_DIST - d) / ATTRACT_DIST) * 0.55;
          p.vx -= (dx / d) * f * 0.009;
          p.vy -= (dy / d) * f * 0.009;
        }

        p.vx += (p.ox - p.x) * 0.00055;
        p.vy += (p.oy - p.y) * 0.00055;
        p.vx *= 0.966;
        p.vy *= 0.966;
        p.x  += p.vx;
        p.y  += p.vy;

        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        p.ph += 0.013;

        const hue = isL ? p.lhue : p.hue;
        const distToCursor = Math.sqrt((p.x - mx) ** 2 + (p.y - my) ** 2);

        /* ── Halo ring near cursor ── */
        if (distToCursor < HALO_DIST) {
          const strength = 1 - distToCursor / HALO_DIST;
          const haloRadius = p.r * 10 * strength + 5;
          const grad = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, haloRadius);
          grad.addColorStop(0, `hsla(${hue},${dotSat}%,${dotL}%,${haloA * strength})`);
          grad.addColorStop(1, `hsla(${hue},${dotSat}%,${dotL}%,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        /* ── Dot ── */
        const pulse  = 0.78 + 0.22 * Math.sin(p.ph);
        const alpha  = dotA * pulse;
        const radius = p.r * (distToCursor < HALO_DIST
          ? (1 + (1 - distToCursor / HALO_DIST) * 0.6) // enlarge near cursor
          : 1);

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},${dotSat}%,${dotL}%,${alpha})`;
        ctx.fill();

        // Inner bright core (light mode: white, dark mode: white highlight)
        if (p.r > 0.9) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = isL
            ? `hsla(${hue},20%,98%,${alpha * 0.8})`
            : `hsla(${hue},50%,95%,${alpha * 0.6})`;
          ctx.fill();
        }
      });

      /* ── Connection lines ── */
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);

          if (d < CONNECT_DIST) {
            const ratio = 1 - d / CONNECT_DIST;

            const cDist = Math.min(
              Math.sqrt((pts[i].x - mx) ** 2 + (pts[i].y - my) ** 2),
              Math.sqrt((pts[j].x - mx) ** 2 + (pts[j].y - my) ** 2)
            );
            const boost = cDist < ATTRACT_DIST
              ? 1 + (1 - cDist / ATTRACT_DIST) * 2.8
              : 1;

            const alpha = lineA * ratio * boost;
            const width = (isL ? 0.7 : 0.5) + ratio * boost * 0.9;
            const hue   = isL
              ? (pts[i].lhue + pts[j].lhue) / 2
              : (pts[i].hue  + pts[j].hue)  / 2;

            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `hsla(${hue},${dotSat}%,${dotL}%,${Math.min(alpha, 0.9)})`;
            ctx.lineWidth   = width;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize',    resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('mouseleave',onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0, pointerEvents: 'none',
        // Both modes fully visible — light mode gets full opacity
        opacity: theme === 'light' ? 1.0 : 0.55,
        transition: 'opacity 1.2s ease',
      }}
    />
  );
}
