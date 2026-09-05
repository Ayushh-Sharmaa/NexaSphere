import { useState, useCallback } from 'react';
import { NAV_HEIGHTS } from '../data/config';

export function useAppNavigation(setPage, setActiveTab, mobile) {
  const [wipeOn, setWipeOn] = useState(false);
  const [wipePh, setWipePh] = useState(0);

  const performTransition = useCallback((action) => {
    setWipeOn(true);
    setWipePh(0);
    setTimeout(() => setWipePh(1), 10);
    setTimeout(() => {
      action();
      setWipePh(2);
      setTimeout(() => {
        setWipeOn(false);
        setWipePh(0);
      }, 500);
    }, 600);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    if (tab === 'Home') {
      performTransition(() => setPage(null));
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    } else {
      const id = `section-${tab.toLowerCase()}`;
      const element = document.getElementById(id);
      if (element) {
        const navHeight = mobile ? NAV_HEIGHTS.MOBILE : NAV_HEIGHTS.DESKTOP;
        const targetY = element.offsetTop - navHeight;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else {
        performTransition(() => setPage({ type: 'section', section: tab }));
      }
    }
  }, [setActiveTab, setPage, mobile, performTransition]);

  return { wipeOn, wipePh, handleTabChange, performTransition };
}
