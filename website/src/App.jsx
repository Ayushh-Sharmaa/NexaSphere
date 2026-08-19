import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  lazy,
  Suspense,
  memo,
} from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from 'react-router-dom';

// Style overrides and design system stylesheets
import './styles/themes.css';
import './styles/globals.css';
import './styles/animations.css';
import './styles/components.css';
import './styles/portfolio.css';
import './styles/pwa.css';
import './styles/aurora.css';
import './styles/motion.css';
import './styles/material-system.css';
import './styles/design-styles.css';
import './styles/accessibility.css'; // always last — highest specificity
import './i18n';

// Brand asset used in page-wipe transition overlay
import nexasphereLogo from './assets/images/logos/nexasphere-logo.png';

// Core structural elements
import AppRoutes from './router/routes';
import useAppBootstrap from './hooks/useAppBootstrap';
import { useTheme } from './hooks/useTheme';
import { useDeveloperMode } from './hooks/useDeveloperMode';
import { useInteractionEffects } from './hooks/useInteractionEffects';
import { useBackToTop } from './hooks/useScrollLogic';

// Shared layout and telemetry widgets
import Navbar from './shared/Navbar';
import SkipLink from './components/common/SkipLink';
import MoveToTop from './shared/MoveToTop';
import ScrollProgress from './shared/ScrollProgress';
import Terminal from './components/developer/Terminal';
import CinematicOpening from './shared/CinematicOpening';
import OfflineBanner from './components/pwa/OfflineBanner.jsx';
import InstallPrompt from './components/pwa/InstallPrompt.jsx';
import UpdatePrompt from './components/pwa/UpdatePrompt.jsx';
import EnablePushPrompt from './components/pwa/EnablePushPrompt.jsx';

import {
  AmbientOrbs,
  useNsReveal,
  useHeroParallax,
  useNavScrollTint,
  useGlobalMouseParallax,
  useMagneticCards,
} from './shared/MotionLayer';
import { activityPages } from './data/activities/index';

const isPlaywright =
  typeof window !== 'undefined' && window.navigator.userAgent.includes('Playwright');

import { StudentAuthProvider, useStudentAuth } from './context/StudentAuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import { PageLoadingSpinner } from './router/ProtectedRoute';
import { WalkthroughOverlay } from './components/walkthrough/WalkthroughOverlay';
import { useWalkthroughStore } from './store/useWalkthroughStore';
import { useAnalytics } from './hooks/useAnalytics';
import { SessionRecordingProvider } from './context/SessionRecordingProvider';

const MNH = 88;
const DNH = 64;

// Lazy-loaded heavy pages
const RecruitmentPage = lazy(() => import('./pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('./pages/membership/MembershipPage'));
const ActivitiesPage = lazy(() => import('./pages/activities/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('./pages/activities/ActivityDetailPage'));
const EventsPage = lazy(() => import('./pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/events/EventDetailPage'));
const AboutPage = lazy(() => import('./pages/about/AboutPage'));
const TeamPage = lazy(() => import('./pages/team/TeamPage'));
const ContactPage = lazy(() => import('./pages/contact/ContactPage'));
const ResourcesPage = lazy(() => import('./pages/resources/ResourcesPage'));
const RoadmapsPage = lazy(() => import('./pages/roadmaps/RoadmapsPage'));
const CertificateVerifyPage = lazy(() => import('./pages/certificates/CertificateVerifyPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const WorkspacePage = lazy(() => import('./pages/workspace/WorkspacePage'));
const ForumPage = lazy(() => import('./pages/forum/ForumPage'));
const ForumThreadPage = lazy(() => import('./pages/forum/ForumThreadPage'));
const LoginPage = lazy(() => import('./pages/login/LoginPage'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const LiveStreamPage = lazy(() => import('./pages/streaming/LiveStreamPage'));
const SponsorsPage = lazy(() => import('./pages/sponsors/SponsorsPage'));
const NotificationHistoryPage = lazy(() => import('./pages/notifications/NotificationHistoryPage'));

/* ── Page wipe transition ── */
const Wipe = memo(function Wipe({ on: wipeOn, ph }) {
  if (!wipeOn) return null;
  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8000,
          background: 'var(--bg)',
          animation: `${ph === 'out' ? 'wipeDown .27s' : 'wipeUp .30s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'all',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8001,
          background: 'linear-gradient(90deg,#CC1111,#880000,#EE2222)',
          opacity: 0.09,
          animation: `${ph === 'out' ? 'wipeDown .20s .04s' : 'wipeUp .24s .04s'} cubic-bezier(.77,0,.18,1) forwards`,
          pointerEvents: 'none',
        }}
      />
      {ph === 'out' && <div className="wipe-shimmer" aria-hidden="true" />}
      {ph === 'in' && <PageFlash />}
      {ph === 'out' && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            zIndex: 8002,
            pointerEvents: 'none',
            opacity: 0,
            animation: 'splashIn .16s .1s ease forwards',
          }}
        >
          <img
            src={nexasphereLogo}
            style={{
              height: '46px',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 12px var(--c1))',
              opacity: 0.6,
            }}
            alt=""
          />
        </div>
      )}
    </>
  );
});

/* ── Page enter animation ── */
const PageIn = memo(function PageIn({ children, k }) {
  const [r, setR] = useState(false);
  useLayoutEffect(() => {
    let rafOne = 0;
    let rafTwo = 0;
    setR(false);
    rafOne = requestAnimationFrame(() => {
      rafTwo = requestAnimationFrame(() => setR(true));
    });
    return () => {
      cancelAnimationFrame(rafOne);
      cancelAnimationFrame(rafTwo);
    };
  }, [k]);
  return (
    <div
      style={{
        opacity: r ? 1 : 0,
        transform: r ? 'none' : 'translateY(16px) scale(.99)',
        transition:
          'opacity .42s cubic-bezier(.22,1,.36,1),transform .42s cubic-bezier(.22,1,.36,1)',
        willChange: 'opacity,transform',
      }}
    >
      {children}
    </div>
  );
});

/* ── Anti-gravity orb cursor ── */
function Cursor() {
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
    visible: true,
    raf: null,
  });

  useEffect(() => {
    if (window.matchMedia('(hover:none)').matches) return;
    document.body.style.cursor = 'none';
    const s = stateRef.current;
    const onMove = (e) => {
      s.mx = e.clientX;
      s.my = e.clientY;
    };
    const onDown = () => {
      s.clicking = true;
    };
    const onUp = () => {
      s.clicking = false;
    };
    const onOver = (e) => {
      s.hovering = !!e.target.closest('button,a,[role="button"],[tabindex]');
    };
    const onMouseLeave = () => {
      s.visible = false;
      if (orbRef.current) orbRef.current.style.display = 'none';
      if (trailRef.current) trailRef.current.style.display = 'none';
      if (glowRef.current) glowRef.current.style.display = 'none';
    };
    const onMouseEnter = () => {
      s.visible = true;
      if (orbRef.current) orbRef.current.style.display = 'block';
      if (trailRef.current) trailRef.current.style.display = 'block';
      if (glowRef.current) glowRef.current.style.display = 'block';
    };
    const tick = () => {
      s.ox += (s.mx - s.ox) * 1.0;
      s.oy += (s.my - s.oy) * 1.0;
      s.floatPhase += 0.022;
      s.floatY =
        Math.sin(s.floatPhase) * 2 +
        Math.sin(s.floatPhase * 1.7) * 1 +
        Math.sin(s.floatPhase * 0.5) * 1;
      const fy = s.oy + s.floatY;
      const scale = s.clicking ? 0.7 : s.hovering ? 1.55 : 1;
      const opacity = s.visible ? (s.hovering ? 0.95 : 0.82) : 0;
      if (orbRef.current) {
        orbRef.current.style.left = s.ox + 'px';
        orbRef.current.style.top = fy + 'px';
        orbRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
        orbRef.current.style.opacity = opacity;
      }
      if (trailRef.current) {
        trailRef.current.style.left = s.ox + 'px';
        trailRef.current.style.top = s.oy + s.floatY * 0.4 + 'px';
        trailRef.current.style.opacity = s.visible ? (s.hovering ? 0 : 0.35) : 0;
      }
      if (glowRef.current) {
        glowRef.current.style.left = s.mx + 'px';
        glowRef.current.style.top = s.my + 'px';
        glowRef.current.style.opacity = s.visible ? 1 : 0;
      }
      s.raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);
    s.raf = requestAnimationFrame(tick);
    return () => {
      document.body.style.cursor = '';
      cancelAnimationFrame(s.raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
    };
  }, []);

  return (
    <>
      <div
        ref={glowRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10000,
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(204,17,17,.055) 0%, rgba(136,0,0,.03) 40%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          transition: 'opacity .3s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={trailRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 10002,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(204,17,17,0.7) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)',
          filter: 'blur(6px)',
          transition: 'opacity .25s',
          willChange: 'transform, opacity',
        }}
      />
      <div
        ref={orbRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          zIndex: 100000,
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #fff 0%, #CC1111 40%, #880000 100%)',
          boxShadow:
            '0 0 10px rgba(204,17,17,.9), 0 0 24px rgba(204,17,17,.5), 0 0 50px rgba(136,0,0,.3)',
          transition: 'transform .08s cubic-bezier(.34,1.56,.64,1), opacity .2s',
          willChange: 'transform, opacity',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '22%',
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,.9)',
            filter: 'blur(1px)',
          }}
        />
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────
   Root App — wraps everything in BrowserRouter
───────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const location = useLocation();
  const isPlaywright =
    typeof navigator !== 'undefined' && navigator.userAgent.includes('Playwright');
  const [cinDone, setCinDone] = useState(isPlaywright || location.pathname !== '/');
  const { resolvedTheme: theme, setTheme } = useTheme();
  const { isOpen: isTerminalOpen, closeTerminal } = useDeveloperMode();

  const { eventsData, swUpdateFn } = useAppBootstrap(cinDone);

  // Skip cinematic opening for deep links (anything except "/")
  useEffect(() => {
    if (location.pathname !== '/' || isPlaywright) {
      setCinDone(true);
    }
  }, [location.pathname, isPlaywright]);

  return (
    <>
      {/* Skip-to-content link: visible only on first Tab press */}
      <SkipLink targetId="main-content" />

      <OfflineBanner />
      <InstallPrompt />
      {swUpdateFn && <UpdatePrompt updateSW={swUpdateFn} />}
      <EnablePushPrompt />

      {/* Loading cover to prevent flash during intro sequence */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 8900,
          background: theme === 'light' ? '#FFFFFF' : '#0A0A0A',
          opacity: cinDone ? 0 : 1,
          transition: 'opacity .5s ease',
          pointerEvents: 'none',
        }}
      />

      {!cinDone && <CinematicOpening theme={theme} onDone={() => setCinDone(true)} />}

      {cinDone && <ScrollProgress />}
      <Cursor />

      <MainRouter
        cinDone={cinDone}
        setCinDone={setCinDone}
        theme={theme}
        setTheme={setTheme}
        eventsData={eventsData}
        isTerminalOpen={isTerminalOpen}
        closeTerminal={closeTerminal}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────
   RequireAuth Wrapper (Passthrough — Login removed)
───────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  return children;
}

/* ─────────────────────────────────────────────────────
   MainRouter — renders the Navbar + Routes
───────────────────────────────────────────────────── */
function MainRouter({ cinDone, theme, setTheme, eventsData, isTerminalOpen, closeTerminal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId } = useAnalytics();

  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  const [wipeOn, setWipeOn] = useState(false);
  const [wipePh, setWipePh] = useState('out');
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', fn, { passive: true });
    return () => window.removeEventListener('resize', fn);
  }, []);

  // Sync activeTab with route path
  useEffect(() => {
    const pathMap = {
      '/': 'Home',
      '/activities': 'Activities',
      '/events': 'Events',
      '/roadmaps': 'Roadmaps',
      '/about': 'About',
      '/team': 'Core Team',
      '/contact': 'Contact',
      '/dashboard': 'Dashboard',
      '/analytics': 'Analytics',
      '/apply': 'Apply',
      '/join': 'Join',
      '/forum': 'Forum',
      '/resources': 'Resources',
      '/sponsors': 'Sponsors',
    };
    const tab = pathMap[location.pathname] || 'Home';
    setActiveTab(tab);
  }, [location.pathname]);

  // Scroll spy on home page
  useEffect(() => {
    if (location.pathname !== '/') return;
    const HOME_SECTIONS = ['Home', 'Activities', 'Events', 'About', 'Core Team', 'Contact'];
    const nh = mobile ? MNH : DNH;
    const fn = () => {
      const sy = window.scrollY + nh + 30;
      for (let i = HOME_SECTIONS.length - 1; i >= 0; i--) {
        const idStr = HOME_SECTIONS[i] === 'Core Team' ? 'team' : HOME_SECTIONS[i].toLowerCase();
        const el = document.getElementById(`section-${idStr}`);
        if (el && el.offsetTop <= sy) {
          setActiveTab(HOME_SECTIONS[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [mobile, location.pathname]);

  // Wire motion effects and event scroll behaviors
  useInteractionEffects(cinDone, location.pathname !== '/');
  useBackToTop();
  useNsReveal([cinDone, location.pathname]);
  useHeroParallax();
  useNavScrollTint();
  useGlobalMouseParallax();
  useMagneticCards();

  // Screen wipe transition utility
  const nav = useCallback(
    (path, fn) => {
      setWipeOn(true);
      setWipePh('out');
      setTimeout(() => {
        if (fn) fn();
        if (path) navigate(path);
        window.scrollTo({ top: 0 });
        requestAnimationFrame(() => {
          setWipePh('in');
          setTimeout(() => setWipeOn(false), 340);
        });
      }, 275);
    },
    [navigate]
  );

  const onTab = useCallback(
    (tab) => {
      const routeMap = {
        Dashboard: '/dashboard',
        Analytics: '/analytics',
        Activities: '/activities',
        Events: '/events',
        Roadmaps: '/roadmaps',
        Resources: '/resources',
        Collab: '/collab',
        About: '/about',
        'Core Team': '/team',
        Contact: '/contact',
        Forum: '/forum',
        Sponsors: '/sponsors',
      };
      const targetPath = routeMap[tab];
      if (targetPath) {
        nav(targetPath);
        return;
      }
      if (tab === 'Home') {
        if (location.pathname !== '/') {
          nav('/');
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      const idStr = tab === 'Core Team' ? 'team' : tab.toLowerCase();
      if (location.pathname === '/') {
        setActiveTab(tab);
        const el = document.getElementById(`section-${idStr}`);
        if (el) {
          window.scrollTo({
            top: el.offsetTop - (mobile ? MNH : DNH),
            behavior: 'smooth',
          });
        }
      } else {
        nav('/', () => {
          setTimeout(() => {
            const el = document.getElementById(`section-${idStr}`);
            if (el) {
              window.scrollTo({
                top: el.offsetTop - (mobile ? MNH : DNH),
                behavior: 'smooth',
              });
            }
          }, 50);
        });
      }
    },
    [nav, mobile, location.pathname]
  );

  const openApply = useCallback(() => nav('/apply'), [nav]);
  const openJoin = useCallback(() => nav('/join'), [nav]);
  const onBackHome = useCallback(() => nav('/'), [nav]);

  const onNavigate = useCallback(
    (type, title) => {
      if (type === 'activity') nav(`/activities/${encodeURIComponent(title)}`);
    },
    [nav]
  );

  const onKSSClick = useCallback(
    (ev) => {
      nav(`/events/${ev.id || encodeURIComponent(ev.name || '')}`);
    },
    [nav]
  );

  const nh = mobile ? MNH : DNH;

  return (
    <SessionRecordingProvider sessionId={sessionId}>
      {cinDone && <AmbientOrbs theme={theme} />}
      <SkipLink targetId="main-content" label="Skip to main content" />
      {cinDone && <Navbar activeTab={activeTab} onTabChange={onTab} />}

      <Wipe on={wipeOn} ph={wipePh} />

      <main
        id="main-content"
        tabIndex={-1}
        style={{ paddingTop: nh, position: 'relative', zIndex: 1 }}
        aria-label="Main content"
      >
        <Suspense fallback={<PageLoadingSpinner />}>
          <AppRoutes
            cinDone={cinDone}
            theme={theme}
            eventsData={eventsData}
            nav={nav}
            onTab={onTab}
            onNavigate={onNavigate}
            onKSSClick={onKSSClick}
            openApply={openApply}
            openJoin={openJoin}
            onBackHome={onBackHome}
          />
        </Suspense>
      </main>

      {cinDone && <MoveToTop />}

      <Terminal
        isOpen={isTerminalOpen}
        onClose={closeTerminal}
        theme={theme}
        setTheme={setTheme}
        onNavigate={onTab}
      />
    </SessionRecordingProvider>
  );
}
