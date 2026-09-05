import { useEffect } from 'react';

const MAGNETIC_DIST_THRESHOLD = 88;
const MAGNETIC_INTENSITY = 0.32;
const ACTIVITY_CARD_PARALLAX_MAX = 6;
const ACTIVITY_CARD_DIST_RATIO = 0.9;
const INTERSECTION_THRESHOLD = 0.09;
const ROOT_MARGIN_BOTTOM = '0px 0px -36px 0px';

export function useInteractionEffects(cinDone, page) {
  useEffect(() => {
    if (!cinDone) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fired');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: INTERSECTION_THRESHOLD, rootMargin: ROOT_MARGIN_BOTTOM });

    document.querySelectorAll('.pop-in, .pop-left, .pop-right, .pop-scale, .pop-flip, .pop-word, .pop-num')
      .forEach(el => observer.observe(el));

    const magneticButtons = document.querySelectorAll('.mag-btn');
    const activityCards = document.querySelectorAll('.activity-card');

    const handleMouseMove = e => {
      magneticButtons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < MAGNETIC_DIST_THRESHOLD) {
          const factor = (MAGNETIC_DIST_THRESHOLD - dist) / MAGNETIC_DIST_THRESHOLD * MAGNETIC_INTENSITY;
          btn.style.transform = `translate(${dx * factor}px, ${dy * factor}px)`;
        } else {
          btn.style.transform = '';
        }
      });

      activityCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.max(rect.width, rect.height) * ACTIVITY_CARD_DIST_RATIO;
        
        if (dist < maxDist) {
          const intensity = (1 - dist / maxDist) * ACTIVITY_CARD_PARALLAX_MAX;
          card.style.setProperty('--rx', (dx / rect.width * intensity).toFixed(2));
          card.style.setProperty('--ry', (-dy / rect.height * intensity).toFixed(2));
        } else {
          card.style.setProperty('--rx', '0');
          card.style.setProperty('--ry', '0');
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cinDone, page]);
}
