import { useEffect, useRef } from 'react';

export default function ScrollProgress() {
  const progressRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const updateProgress = () => {
      const { scrollY } = window;
      const { scrollHeight, clientHeight } = document.documentElement;
      const maxScroll = Math.max(0, scrollHeight - clientHeight);
      const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (scrollY / maxScroll) * 100)) : 0;

      if (progressRef.current) {
        progressRef.current.style.width = `${progress}%`;
      }
      frameRef.current = null;
    };

    const onScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="scroll-progress-root"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: '3px',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div className="scroll-progress-bar" ref={progressRef} />
    </div>
  );
}
