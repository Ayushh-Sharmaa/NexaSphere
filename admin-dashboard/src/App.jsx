import React, { Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { useAdminShortcuts } from "./hooks/useAdminShortcuts";
import CommandMenu from "./components/CommandMenu";
import "./styles/admin.css";

// Components
import { Sidebar } from "./components/Sidebar";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Toast } from "./components/Toast";
import { OfflineBanner } from "./components/OfflineBanner";
import { ImpersonationBanner } from "./components/ImpersonationBanner";
import ErrorBoundary from "./components/ErrorBoundary";
import { OnboardingTour } from "./components/OnboardingTour";

// Lazy-loaded pages with module exports mapping
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage }))
);
const UnauthorizedPage = lazy(() =>
  import("./pages/UnauthorizedPage").then((m) => ({
    default: m.UnauthorizedPage,
  }))
);
const DashboardHome = lazy(() =>
  import("./pages/DashboardHome").then((m) => ({ default: m.DashboardHome }))
);
const ProjectHealthDashboard = lazy(() =>
  import("./pages/ProjectHealthDashboard").then((m) => ({
    default: m.ProjectHealthDashboard,
  }))
);
const ComprehensiveAnalytics = lazy(() =>
  import("./pages/ComprehensiveAnalytics").then((m) => ({
    default: m.ComprehensiveAnalytics,
  }))
);
const FunnelAnalysis = lazy(() =>
  import("./pages/FunnelAnalysis").then((m) => ({ default: m.FunnelAnalysis }))
);
const CustomEventTracking = lazy(() =>
  import("./pages/CustomEventTracking").then((m) => ({
    default: m.CustomEventTracking,
  }))
);
const EventsManager = lazy(() =>
  import("./pages/EventsManager").then((m) => ({ default: m.EventsManager }))
);
const EventRegistrations = lazy(() =>
  import("./pages/EventRegistrations").then((m) => ({
    default: m.EventRegistrations,
  }))
);
const EventScanner = lazy(() =>
  import("./pages/EventScanner").then((m) => ({ default: m.EventScanner }))
);
const EventAnalytics = lazy(() =>
  import("./pages/EventAnalytics").then((m) => ({ default: m.EventAnalytics }))
);
const EventAttendanceReport = lazy(() =>
  import("./pages/EventAttendanceReport").then((m) => ({
    default: m.EventAttendanceReport,
  }))
);
const ActivityEventsManager = lazy(() =>
  import("./pages/ActivityEventsManager").then((m) => ({
    default: m.ActivityEventsManager,
  }))
);
const CoreTeamManager = lazy(() =>
  import("./pages/CoreTeamManager").then((m) => ({
    default: m.CoreTeamManager,
  }))
);
const MembershipResponsesManager = lazy(() =>
  import("./pages/MembershipResponsesManager").then((m) => ({
    default: m.MembershipResponsesManager,
  }))
);
const SyncMonitor = lazy(() =>
  import("./pages/SyncMonitor").then((m) => ({ default: m.SyncMonitor }))
);
const RecruitmentResponsesManager = lazy(() =>
  import("./pages/RecruitmentResponsesManager").then((m) => ({
    default: m.RecruitmentResponsesManager,
  }))
);
const ApplicationsManager = lazy(() => import("./pages/ApplicationsManager"));
const CertificateManager = lazy(() =>
  import("./pages/CertificateManager").then((m) => ({
    default: m.CertificateManager,
  }))
);
const AnnouncementsManager = lazy(() =>
  import("./pages/AnnouncementsManager").then((m) => ({
    default: m.AnnouncementsManager,
  }))
);
const ForumManager = lazy(() =>
  import("./pages/ForumManager").then((m) => ({ default: m.ForumManager }))
);
const StreamManager = lazy(() =>
  import("./pages/StreamManager").then((m) => ({ default: m.StreamManager }))
);
const CircuitBreakerManager = lazy(() =>
  import("./pages/CircuitBreakerManager").then((m) => ({
    default: m.CircuitBreakerManager,
  }))
);
const WaitingRoomManager = lazy(() =>
  import("./pages/WaitingRoomManager").then((m) => ({
    default: m.WaitingRoomManager,
  }))
);
const UserGroups = lazy(() => import("./pages/UserGroups"));
const RolesManager = lazy(() =>
  import("./pages/RolesManager").then((m) => ({ default: m.RolesManager }))
);
const ScheduledTasksManager = lazy(
  () => import("./pages/ScheduledTasksManager")
);
const BackupsManager = lazy(() =>
  import("./pages/BackupsManager").then((m) => ({ default: m.BackupsManager }))
);
const ResourcesManager = lazy(() =>
  import("./pages/ResourcesManager").then((m) => ({
    default: m.ResourcesManager,
  }))
);
const ComplianceManager = lazy(() =>
  import("./pages/ComplianceManager").then((m) => ({
    default: m.ComplianceManager,
  }))
);
const SponsorshipsManager = lazy(() =>
  import("./pages/SponsorshipsManager").then((m) => ({
    default: m.SponsorshipsManager,
  }))
);
const AuditLogViewer = lazy(() => import("./pages/dashboard/AuditLogViewer"));
const UserEngagementReport = lazy(() =>
  import("./pages/UserEngagementReport").then((m) => ({
    default: m.UserEngagementReport,
  }))
);
const SecurityCenter = lazy(() =>
  import("./pages/SecurityCenter").then((m) => ({ default: m.SecurityCenter }))
);
const ActivityLogs = lazy(() =>
  import("./pages/ActivityLogs").then((m) => ({ default: m.ActivityLogs }))
);
const ModerationManager = lazy(() =>
  import("./pages/ModerationManager").then((m) => ({
    default: m.ModerationManager,
  }))
);
const RBACManager = lazy(() =>
  import("./pages/RBACManager").then((m) => ({ default: m.RBACManager }))
);
const SsoInvitePage = lazy(() =>
  import("./pages/SsoInvitePage").then((m) => ({ default: m.SsoInvitePage }))
);
const UserSegmentation = lazy(() =>
  import("./pages/UserSegmentation").then((m) => ({
    default: m.UserSegmentation,
  }))
);
const RateLimitMonitor = lazy(
  () => import("./pages/dashboard/RateLimitMonitor")
);
const ScheduledReports = lazy(
  () => import("./pages/dashboard/ScheduledReports")
);
const BannersManager = lazy(() =>
  import("./pages/BannersManager").then((m) => ({ default: m.BannersManager }))
);
const LiveQaManager = lazy(() =>
  import("./pages/LiveQaManager").then((m) => ({ default: m.LiveQaManager }))
);
const UserManager = lazy(() => import("./pages/UserManager"));
const EventPlanningManager = lazy(() =>
  import("./pages/EventPlanningManager").then((m) => ({
    default: m.EventPlanningManager,
  }))
);
const ImpersonationManager = lazy(() =>
  import("./pages/ImpersonationManager").then((m) => ({
    default: m.ImpersonationManager,
  }))
);
const SubscriptionsManager = lazy(() =>
  import("./pages/SubscriptionsManager").then((m) => ({
    default: m.SubscriptionsManager,
  }))
);
const RealTimeDashboard = lazy(() => import("./pages/RealTimeDashboard"));
const AlertManager = lazy(() =>
  import("./pages/AlertManager").then((m) => ({ default: m.AlertManager }))
);
const SessionPlayer = lazy(() =>
  import("./pages/SessionPlayer").then((m) => ({ default: m.SessionPlayer }))
);
const PlatformSettings = lazy(
  () => import("./pages/dashboard/PlatformSettings")
);

function PageFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "280px",
        color: "var(--text-secondary, #94a3b8)",
        fontSize: "0.92rem",
        fontWeight: 500,
        gap: "12px",
      }}
    >
      <span className="brand-dot" style={{ display: "inline-block" }} />
      <span>Loading module…</span>
    </div>
  );
}

function RequireAuth() {
  const { isLoading, isVerified } = useAuth();

  if (isLoading) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ textAlign: "center" }}>
          <span
            className="brand-dot lg"
            style={{ display: "block", margin: "0 auto 1rem" }}
          />
          <p className="login-sub">Verifying session…</p>
        </div>
      </div>
    );
  }

  return isVerified ? <Outlet /> : <Navigate to="/login" replace />;
}

function DashboardLayout() {
  const [isCommandMenuOpen, setIsCommandMenuOpen] = React.useState(false);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = React.useState(false);

  useAdminShortcuts({
    onOpenCommandMenu: () => setIsCommandMenuOpen(true),
    onToggleShortcutsHelp: () => setIsShortcutsHelpOpen((prev) => !prev),
  });

  return (
    <div className="app-layout">
      <OfflineBanner />
      <ImpersonationBanner />
      <Sidebar />
      <main
        className="main-content"
        id="main-content"
        style={{ paddingBottom: "88px" }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <MobileBottomNav />
      <Toast />
      <OnboardingTour />
      <CommandMenu
        isOpen={isCommandMenuOpen}
        onClose={() => setIsCommandMenuOpen(false)}
      />
      <CommandMenu
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
        isHelpMode={true}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route
                path="/dashboard/settings"
                element={<PlatformSettings />}
              />
              <Route path="/dashboard" element={<DashboardHome />} />
              <Route
                path="/dashboard/project-health"
                element={<ProjectHealthDashboard />}
              />
              <Route
                path="/dashboard/analytics"
                element={<ComprehensiveAnalytics />}
              />
              <Route
                path="/dashboard/analytics/funnel"
                element={<FunnelAnalysis />}
              />
              <Route
                path="/dashboard/analytics/custom-events"
                element={<CustomEventTracking />}
              />
              <Route path="/dashboard/events" element={<EventsManager />} />
              <Route
                path="/dashboard/event-registrations"
                element={<EventRegistrations />}
              />
              <Route
                path="/dashboard/event-scanner"
                element={<EventScanner />}
              />
              <Route
                path="/dashboard/event-analytics"
                element={<EventAnalytics />}
              />
              <Route
                path="/dashboard/reports/attendance"
                element={<EventAttendanceReport />}
              />
              <Route
                path="/dashboard/activity-events"
                element={<ActivityEventsManager />}
              />
              <Route
                path="/dashboard/core-team"
                element={<CoreTeamManager />}
              />
              <Route
                path="/dashboard/applications"
                element={<ApplicationsManager />}
              />
              <Route
                path="/dashboard/membership"
                element={<MembershipResponsesManager />}
              />
              <Route path="/dashboard/sync-monitor" element={<SyncMonitor />} />
              <Route
                path="/dashboard/recruitment"
                element={<RecruitmentResponsesManager />}
              />
              <Route
                path="/dashboard/certificates"
                element={<CertificateManager />}
              />
              <Route
                path="/dashboard/announcements"
                element={<AnnouncementsManager />}
              />
              <Route path="/dashboard/forum" element={<ForumManager />} />
              <Route path="/dashboard/streams" element={<StreamManager />} />
              <Route
                path="/dashboard/circuit-breaker"
                element={<CircuitBreakerManager />}
              />
              <Route
                path="/dashboard/waiting-room"
                element={<WaitingRoomManager />}
              />
              <Route path="/dashboard/groups" element={<UserGroups />} />
              <Route path="/dashboard/roles" element={<RolesManager />} />
              <Route
                path="/dashboard/tasks"
                element={<ScheduledTasksManager />}
              />
              <Route path="/dashboard/backups" element={<BackupsManager />} />
              <Route
                path="/dashboard/resources"
                element={<ResourcesManager />}
              />
              <Route
                path="/dashboard/compliance"
                element={<ComplianceManager />}
              />
              <Route
                path="/dashboard/sponsorships"
                element={<SponsorshipsManager />}
              />
              <Route
                path="/dashboard/audit-logs"
                element={<AuditLogViewer />}
              />
              <Route
                path="/dashboard/reports"
                element={<UserEngagementReport />}
              />
              <Route path="/dashboard/security" element={<SecurityCenter />} />
              <Route
                path="/dashboard/activity-logs"
                element={<ActivityLogs />}
              />
              <Route
                path="/dashboard/moderation"
                element={<ModerationManager />}
              />
              <Route path="/dashboard/rbac" element={<RBACManager />} />
              <Route path="/dashboard/sso-invite" element={<SsoInvitePage />} />
              <Route
                path="/dashboard/user-segmentation"
                element={<UserSegmentation />}
              />
              <Route
                path="/dashboard/rate-limits"
                element={<RateLimitMonitor />}
              />
              <Route
                path="/dashboard/reports/scheduled"
                element={<ScheduledReports />}
              />
              <Route path="/dashboard/banners" element={<BannersManager />} />
              <Route path="/dashboard/qa-poll" element={<LiveQaManager />} />
              <Route path="/dashboard/users" element={<UserManager />} />
              <Route
                path="/dashboard/event-planning"
                element={<EventPlanningManager />}
              />
              <Route
                path="/dashboard/impersonation"
                element={<ImpersonationManager />}
              />
              <Route
                path="/dashboard/subscriptions"
                element={<SubscriptionsManager />}
              />
              <Route
                path="/dashboard/realtime"
                element={<RealTimeDashboard />}
              />
              <Route path="/dashboard/alerts" element={<AlertManager />} />
              <Route
                path="/dashboard/session-player"
                element={<SessionPlayer />}
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
