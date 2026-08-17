import React, { lazy, useState, useEffect, memo, useLayoutEffect } from 'react';
import { Route, Routes, Navigate, useParams } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Lazy-loaded heavy pages
const RecruitmentPage = lazy(() => import('../pages/recruitment/RecruitmentPage'));
const MembershipPage = lazy(() => import('../pages/membership/MembershipPage'));
const ActivitiesPage = lazy(() => import('../pages/activities/ActivitiesPage'));
const ActivityDetailPage = lazy(() => import('../pages/activities/ActivityDetailPage'));
const EventsPage = lazy(() => import('../pages/events/EventsPage'));
const EventDetailPage = lazy(() => import('../pages/events/EventDetailPage'));
const EventPlanningPage = lazy(() => import('../pages/events/EventPlanningPage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));
const TeamPage = lazy(() => import('../pages/team/TeamPage'));
const ContactPage = lazy(() => import('../pages/contact/ContactPage'));
const RoadmapsPage = lazy(() => import('../pages/roadmaps/RoadmapsPage'));
const ProjectsPage = lazy(() => import('../pages/projects/ProjectsPage'));
const ResourcesPage = lazy(() => import('../pages/resources/ResourcesPage'));
const CertificateVerifyPage = lazy(() => import('../pages/certificates/CertificateVerifyPage'));

const PortfolioBuilder = lazy(() => import('../components/portfolio/PortfolioBuilder'));
const PublicPortfolio = lazy(() => import('../pages/portfolio/PublicPortfolio'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const LeaderboardPage = lazy(() => import('../pages/leaderboard/LeaderboardPage'));
const AnalyticsPage = lazy(() => import('../pages/analytics/AnalyticsPage'));
const WorkspacePage = lazy(() => import('../pages/workspace/WorkspacePage'));
const GamificationDashboard = lazy(
  () => import('../components/gamification/GamificationDashboard')
);
const ForumPage = lazy(() => import('../pages/forum/ForumPage'));
const ForumThreadPage = lazy(() => import('../pages/forum/ForumThreadPage'));
const LoginPage = lazy(() => import('../pages/login/LoginPage'));
const MentorsPage = lazy(() => import('../pages/mentorship/MentorsPage'));
const MentorshipDashboard = lazy(() => import('../pages/mentorship/MentorshipDashboard'));
const StatusPage = lazy(() => import('../pages/StatusPage'));
const LiveStreamPage = lazy(() => import('../pages/streaming/LiveStreamPage'));
const LiveQa = lazy(() => import('../pages/events/LiveQa'));
const NotificationHistoryPage = lazy(
  () => import('../pages/notifications/NotificationHistoryPage')
);
const SponsorsPage = lazy(() => import('../pages/sponsors/SponsorsPage'));
const RecommendationsPage = lazy(() => import('../pages/resume/RecommendationsPage'));
const SkillExchangePage = lazy(() => import('../pages/skills/SkillExchangePage'));
const WebhooksPage = lazy(() => import('../pages/monitoring/WebhooksPage'));
const AmaListPage = lazy(() => import('../pages/ama/AmaListPage'));
const AmaThreadPage = lazy(() => import('../pages/ama/AmaThreadPage'));
const RevenueDashboardPage = lazy(() => import('../pages/monitoring/RevenueDashboardPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const AccountSettingsPage = lazy(() => import('../pages/settings/AccountSettingsPage'));
const ExplorePage = lazy(() => import('../pages/explore/ExplorePage'));
const CollabPage = lazy(() => import('../pages/collab/CollabPage'));
const SearchPage = lazy(() => import('../pages/search/SearchPage'));
const TemplateLibrary = lazy(() => import('../pages/TemplateLibrary'));
const CreateEvent = lazy(() => import('../pages/CreateEvent'));
const EventFeedbackForm = lazy(() => import('../pages/EventFeedbackForm'));
const AdminPage = lazy(() => import('../pages/admin/AdminPage'));
const AccessibilityStatement = lazy(() => import('../pages/AccessibilityStatement'));

// Static/Eager page components
import HeroSection from '../pages/home/HeroSection';
import ActivitiesSection from '../pages/activities/ActivitiesSection';
import EventsSection from '../pages/events/EventsSection';
import AboutSection from '../pages/about/AboutSection';
import TeamSection from '../pages/team/TeamSection';
import Footer from '../shared/Footer';
import NotFoundPage from '../pages/NotFoundPage';
import PersonalizedFeed from '../components/recommendations/PersonalizedFeed';
import { DynamicIcon } from '../shared/Icons';
import { activityPages } from '../data/activities/index';
import { SectionDivider, PageFlash } from '../shared/MotionLayer';
import nexasphereLogo from '../assets/images/logos/nexasphere-logo.png';

/* ── Page wipe transition ── */
export const Wipe = memo(function Wipe({ on: wipeOn, ph }) {
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
export const PageIn = memo(function PageIn({ children, k }) {
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

/* ── Route wrapper components (URL param readers) ── */
function ActivityDetailWrapper({ onBack, onSelectEvent }) {
  const { activityKey } = useParams();
  const decoded = decodeURIComponent(activityKey || '');
  const activity = activityPages[decoded];
  if (!activity) return <NotFoundPage onGoHome={onBack} />;
  return (
    <PageIn k={`activity-${decoded}`}>
      <ActivityDetailPage activity={activity} onBack={onBack} onSelectEvent={onSelectEvent} />
    </PageIn>
  );
}

function EventDetailWrapper({ onBack, events }) {
  const { eventId } = useParams();

  let event = null;
  let activityColor = null;
  let activityIcon = null;

  for (const act of Object.values(activityPages)) {
    const found = (act.conductedEvents || []).find(
      (e) =>
        String(e.id) === eventId ||
        encodeURIComponent(e.name || '') === eventId ||
        encodeURIComponent(e.shortName || '') === eventId
    );
    if (found) {
      event = found;
      activityColor = act.color;
      activityIcon = act.icon;
      break;
    }
  }

  if (!event) {
    event = (events || []).find(
      (e) =>
        String(e.id) === eventId ||
        encodeURIComponent(e.name || '') === eventId ||
        encodeURIComponent(e.shortName || '') === eventId
    );
  }

  if (!event) return <NotFoundPage onGoHome={onBack} />;

  const iconElement = activityIcon ? (
    <DynamicIcon
      name={activityIcon}
      size={13}
      style={{ marginRight: '4px', verticalAlign: '-1px' }}
    />
  ) : null;

  return (
    <PageIn k={`event-${eventId}`}>
      <EventDetailPage
        event={event}
        activityColor={activityColor}
        activityIcon={iconElement}
        onBack={onBack}
      />
    </PageIn>
  );
}

function PublicPortfolioWrapper({ onBack }) {
  const { username } = useParams();
  return (
    <PageIn k={`portfolio-${username}`}>
      <PublicPortfolio username={username} onBack={onBack} />
    </PageIn>
  );
}

function CertVerifyWrapper({ onGoHome }) {
  const { certId } = useParams();
  return <CertificateVerifyPage certificateId={certId} onGoHome={onGoHome} />;
}

function WorkspaceWrapper({ onBack }) {
  const { roomId } = useParams();
  return (
    <PageIn k={`workspace-${roomId}`}>
      <WorkspacePage roomId={roomId} onBack={onBack} />
    </PageIn>
  );
}

function EventPlanningWrapper({ onBack }) {
  const { eventId } = useParams();
  return (
    <PageIn k={`event-planning-${eventId}`}>
      <EventPlanningPage event={{ id: eventId, eventId }} onBack={onBack} />
    </PageIn>
  );
}

/* Local recommendations hook */
function useRecommendationsLocal(events) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      const scored = [...events]
        .map((ev) => ({
          ...ev,
          hasDetailPage: !!ev.hasDetailPage,
          dateText: ev.dateText || ev.date || '',
        }))
        .filter((ev) => ev.status !== 'completed')
        .slice(0, 6);
      setRecommendations(scored.length ? scored : events.slice(0, 6));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [events]);
  return { recommendations, loading };
}

/* RecommendationSection */
function RecommendationSection({ events = [], onEventClick }) {
  const { recommendations, loading } = useRecommendationsLocal(events);
  return (
    <section id="section-recommendations" style={{ padding: '80px 0', position: 'relative' }}>
      <div className="container">
        <div style={{ marginBottom: 32 }}>
          <span className="cin-section-label" style={{ display: 'block', marginBottom: 8 }}>
            AI-Powered · Personalised
          </span>
          <h2
            className="section-title"
            style={{ fontSize: 'clamp(1.6rem,4vw,2.4rem)', marginBottom: 8 }}
          >
            Recommended For You
          </h2>
          <p className="section-subtitle" style={{ maxWidth: 500 }}>
            Events and activities picked just for you based on what&apos;s trending in NexaSphere.
          </p>
        </div>
        <PersonalizedFeed events={recommendations} loading={loading} onEventClick={onEventClick} />
      </div>
    </section>
  );
}

/**
 * Main application routing component.
 */
export function AppRoutes({
  cinDone,
  theme,
  eventsData,
  nav,
  onTab,
  onNavigate,
  onKSSClick,
  openApply,
  openJoin,
  onBackHome,
}) {
  return (
    <Routes>
      {/* ── Home (scrollable sections) ── */}
      <Route
        path="/"
        element={
          cinDone ? (
            <PageIn k="home">
              <HeroSection
                onTabChange={onTab}
                onApply={openApply}
                onJoin={openJoin}
                theme={theme}
              />
              <SectionDivider />
              <ActivitiesSection onNavigate={onNavigate} />
              <SectionDivider />
              <EventsSection onEventClick={onKSSClick} events={eventsData} />
              <SectionDivider />
              <AboutSection />
              <SectionDivider />
              <TeamSection onApply={openApply} />
              <div id="section-contact">
                <Footer
                  onAdmin={() => {}}
                  onProjects={() => onTab('Projects')}
                  onRoadmaps={() => onTab('Roadmaps')}
                />
              </div>
            </PageIn>
          ) : null
        }
      />

      {/* ── Activities ── */}
      <Route
        path="/activities"
        element={
          <PageIn k="activities">
            <ActivitiesPage onNavigate={onNavigate} onBack={onBackHome} />
          </PageIn>
        }
      />
      <Route
        path="/activities/:activityKey"
        element={
          <ActivityDetailWrapper onBack={() => nav('/activities')} onSelectEvent={onKSSClick} />
        }
      />

      {/* ── Events ── */}
      <Route
        path="/events"
        element={
          <PageIn k="events">
            <EventsPage onBack={onBackHome} onEventClick={onKSSClick} events={eventsData} />
          </PageIn>
        }
      />
      <Route
        path="/events/:eventId"
        element={<EventDetailWrapper onBack={() => nav('/events')} events={eventsData} />}
      />
      <Route
        path="/events/:eventId/feedback"
        element={
          <PageIn k="event-feedback">
            <EventFeedbackForm />
          </PageIn>
        }
      />
      <Route
        path="/events/:eventId/qa"
        element={
          <PageIn k="event-qa">
            <LiveQa />
          </PageIn>
        }
      />

      {/* ── Event Planning (collaborative) ── */}
      <Route
        path="/events/:eventId/planning"
        element={
          <ErrorBoundary>
            <EventPlanningWrapper onBack={() => nav('/events')} />
          </ErrorBoundary>
        }
      />

      {/* ── Live Streaming ── */}
      <Route
        path="/stream/:eventId"
        element={
          <PageIn k="stream">
            <LiveStreamPage />
          </PageIn>
        }
      />
      <Route
        path="/stream/:eventId/:streamId"
        element={
          <PageIn k="stream-id">
            <LiveStreamPage />
          </PageIn>
        }
      />

      {/* ── Dashboard (requires auth) ── */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <PageIn k="dashboard">
              <DashboardPage onBack={onBackHome} />
            </PageIn>
          </ProtectedRoute>
        }
      />

      {/* ── Analytics ── */}
      <Route
        path="/analytics"
        element={
          <PageIn k="analytics">
            <AnalyticsPage onBack={onBackHome} />
          </PageIn>
        }
      />

      <Route
        path="/explore"
        element={
          <PageIn k="explore">
            <ExplorePage onBack={onBackHome} eventsData={eventsData} />
          </PageIn>
        }
      />

      <Route
        path="/search"
        element={
          <PageIn k="search">
            <SearchPage />
          </PageIn>
        }
      />

      <Route
        path="/collab"
        element={
          <ProtectedRoute>
            <PageIn k="collab">
              <CollabPage onBack={onBackHome} />
            </PageIn>
          </ProtectedRoute>
        }
      />

      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <PageIn k="portfolio-builder">
              <PortfolioBuilder />
            </PageIn>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gamification"
        element={
          <ProtectedRoute>
            <PageIn k="gamification">
              <GamificationDashboard />
            </PageIn>
          </ProtectedRoute>
        }
      />

      <Route
        path="/recommendations"
        element={
          <PageIn k="recommendations">
            <RecommendationsPage onBack={onBackHome} />
          </PageIn>
        }
      />

      <Route
        path="/mentorship"
        element={
          <PageIn k="mentors">
            <MentorsPage />
          </PageIn>
        }
      />
      <Route
        path="/mentorship/mentors"
        element={
          <PageIn k="mentor-directory">
            <MentorsPage />
          </PageIn>
        }
      />
      <Route
        path="/mentorship/dashboard"
        element={
          <ProtectedRoute>
            <PageIn k="mentorship-dashboard">
              <MentorshipDashboard />
            </PageIn>
          </ProtectedRoute>
        }
      />

      {/* ── Webhooks (monitoring) ── */}
      <Route
        path="/admin/webhooks"
        element={
          <ProtectedRoute>
            <PageIn k="webhooks">
              <WebhooksPage />
            </PageIn>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['admin', 'SuperAdmin', 'faculty']}>
            <PageIn k="admin">
              <AdminPage />
            </PageIn>
          </ProtectedRoute>
        }
      />

      {/* ── AMA Spaces ── */}
      <Route
        path="/ama"
        element={
          <PageIn k="ama">
            <AmaListPage onBack={onBackHome} />
          </PageIn>
        }
      />
      <Route
        path="/ama/:id"
        element={
          <PageIn k="ama-thread">
            <AmaThreadPage />
          </PageIn>
        }
      />
      {/* ── Projects ── */}
      <Route
        path="/projects"
        element={
          <PageIn k="projects">
            <ProjectsPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Roadmaps ── */}
      <Route
        path="/roadmaps"
        element={
          <PageIn k="roadmaps">
            <RoadmapsPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── About ── */}
      <Route
        path="/about"
        element={
          <PageIn k="about">
            <AboutPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Team ── */}
      <Route
        path="/team"
        element={
          <PageIn k="team">
            <TeamPage onBack={onBackHome} onApply={openApply} />
          </PageIn>
        }
      />

      {/* ── Contact ── */}
      <Route
        path="/contact"
        element={
          <PageIn k="contact">
            <ContactPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Recruitment / Apply ── */}
      <Route
        path="/apply"
        element={
          <PageIn k="apply">
            <RecruitmentPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Membership / Join ── */}
      <Route
        path="/join"
        element={
          <PageIn k="join">
            <MembershipPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Certificate Verify ── */}
      <Route path="/verify/:certId" element={<CertVerifyWrapper onGoHome={onBackHome} />} />

      {/* ── Workspace (collaborative room) ── */}
      <Route path="/workspace/:roomId" element={<WorkspaceWrapper onBack={onBackHome} />} />

      {/* ── Forum ── */}
      <Route
        path="/forum"
        element={
          <PageIn k="forum">
            <ForumPage onBack={onBackHome} />
          </PageIn>
        }
      />
      <Route
        path="/forum/:id"
        element={
          <PageIn k="forum-thread">
            <ForumThreadPage onBack={() => nav('/forum')} />
          </PageIn>
        }
      />

      {/* ── Sponsors ── */}
      <Route
        path="/sponsors"
        element={
          <PageIn k="sponsors">
            <SponsorsPage />
          </PageIn>
        }
      />

      {/* ── Resources / Library ── */}
      <Route
        path="/resources"
        element={
          <PageIn k="resources">
            <ResourcesPage onBack={onBackHome} />
          </PageIn>
        }
      />

      {/* ── Notification History ── */}
      <Route
        path="/notifications"
        element={
          <PageIn k="notifications">
            <NotificationHistoryPage />
          </PageIn>
        }
      />

      {/* ── Login / SSO ── */}
      <Route
        path="/login"
        element={
          <PageIn k="login">
            <LoginPage />
          </PageIn>
        }
      />

      {/* ── Status Page ── */}
      <Route
        path="/status"
        element={
          <PageIn k="status">
            <StatusPage />
          </PageIn>
        }
      />

      {/* ── Public Leaderboard ── */}
      <Route
        path="/leaderboard"
        element={
          <PageIn k="leaderboard">
            <LeaderboardPage />
          </PageIn>
        }
      />

      {/* ── Skill Exchange ── */}
      <Route
        path="/skill-exchange"
        element={
          <PageIn k="skill-exchange">
            <SkillExchangePage />
          </PageIn>
        }
      />

      <Route
        path="/templates"
        element={
          <PageIn k="templates">
            <TemplateLibrary />
          </PageIn>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <PageIn k="create-event">
              <CreateEvent />
            </PageIn>
          </ProtectedRoute>
        }
      />

      <Route
        path="/accessibility"
        element={
          <PageIn k="accessibility">
            <AccessibilityStatement />
          </PageIn>
        }
      />

      {/* ── Revenue Dashboard (Admin) ── */}
      <Route
        path="/admin/revenue-dashboard"
        element={
          <ProtectedRoute roles={['admin', 'SuperAdmin', 'faculty']}>
            <PageIn k="revenue-dashboard">
              <RevenueDashboardPage />
            </PageIn>
          </ProtectedRoute>
        }
      />

      {/* ── Profile & Settings ── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <PageIn k="profile">
              <ProfilePage />
            </PageIn>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/account"
        element={
          <ProtectedRoute>
            <PageIn k="settings">
              <AccountSettingsPage />
            </PageIn>
          </ProtectedRoute>
        }
      />
      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage onGoHome={onBackHome} />} />
    </Routes>
  );
}

export default AppRoutes;
