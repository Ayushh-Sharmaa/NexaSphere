import { useEffect } from 'react';

const AUTO_SCROLL_THRESHOLD = 400;

export function useBackToTop() {
  useEffect(() => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    const handleScroll = () => {
      btn.classList.toggle('visible', window.scrollY > AUTO_SCROLL_THRESHOLD);
    };

    const handleClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    btn.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      btn.removeEventListener('click', handleClick);
    };
  }, []);
}

export function useActiveTabObserver(page, mobile, navTabs, navHeights, setActiveTab) {
  useEffect(() => {
    if (page) return;

    const navHeight = mobile ? navHeights.MOBILE : navHeights.DESKTOP;
    
    const handleScroll = () => {
      const scrollY = window.scrollY + navHeight + 30;
      
      for (let i = navTabs.length - 1; i >= 0; i--) {
        const section = document.getElementById(`section-${navTabs[i].toLowerCase()}`);
        if (section && section.offsetTop <= scrollY) {
          setActiveTab(navTabs[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobile, page, navTabs, navHeights, setActiveTab]);
}
