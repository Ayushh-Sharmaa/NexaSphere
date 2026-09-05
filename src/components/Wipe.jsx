import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';
import { PageFlash } from '../shared/MotionLayer';

export default function Wipe({ on, ph }) {
  if (!on) return null;
  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8000,
        background: 'var(--bg)',
        animation: `${ph === 'out' ? 'wipeDown .27s' : 'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,
        pointerEvents: 'all'
      }} />
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 8001,
        background: 'linear-gradient(90deg,#CC1111,#880000,#EE2222)',
        opacity: 0.09,
        animation: `${ph === 'out' ? 'wipeDown .20s .04s' : 'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,
        pointerEvents: 'none'
      }} />

      {ph === 'out' && <div className="wipe-shimmer" aria-hidden="true" />}

      {ph === 'in' && <PageFlash />}
      {ph === 'out' && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 8002,
          pointerEvents: 'none',
          opacity: 0,
          animation: 'splashIn .16s .1s ease forwards'
        }}>
          <img
            src={nexasphereLogo}
            style={{
              height: '46px',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px var(--c1))',
              opacity: 0.6
            }}
            alt=""
          />
        </div>
      )}
    </>
  );
}
