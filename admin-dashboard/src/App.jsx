import CommandMenu from './components/CommandMenu';
import { useAdminShortcuts } from './hooks/useAdminShortcuts';
import React, { Suspense } from 'react';
import RateLimitMonitor from './pages/dashboard/RateLimitMonitor';
const AuditLogViewer = React.lazy(() => import('./pages/dashboard/AuditLogViewer'));
import RateLimitMonitor from './pages/dashboard/RateLimitMonitor';
import PlatformSettings from './pages/dashboard/PlatformSettings';
import AuditLogViewer from './pages/dashboard/AuditLogViewer';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';
import { OfflineBanner } from './components/OfflineBanner';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
const ComprehensiveAnalytics = React.lazy(() => import('./pages/ComprehensiveAnalytics').then(module => ({ default: module.ComprehensiveAnalytics })));
import { ComprehensiveAnalytics } from './pages/ComprehensiveAnalytics';
import { FunnelAnalysis } from './pages/FunnelAnalysis';
import { CustomEventTracking } from './pages/CustomEventTracking';
import { ForumManager } from './pages/ForumManager';
import { MentorshipManager } from './pages/MentorshipManager';
import { DashboardHome } from './pages/DashboardHome';
const EventsManager = React.lazy(() => import('./pages/EventsManager').then(module => ({ default: module.EventsManager })));
import { ActivityEventsManager } from './pages/ActivityEventsManager';
import { ScheduledTasksManager } from './pages/ScheduledTasksManager';
import UserGroups from './pages/UserGroups';

import ScheduledTasksManager from './pages/ScheduledTasksManager';
import UserGroups from './pages/UserGroups';
import { RolesManager } from './pages/RolesManager';
import { CoreTeamManager } from './pages/CoreTeamManager';
import { MembershipResponsesManager } from './pages/MembershipResponsesManager';
import { SyncMonitor } from './pages/SyncMonitor';
import { RecruitmentResponsesManager } from './pages/RecruitmentResponsesManager';
import { CertificateManager } from './pages/CertificateManager';
import { AnnouncementsManager } from './pages/AnnouncementsManager';
import { PortfolioManager } from './pages/PortfolioManager';
import { StreamManager } from './pages/StreamManager';
import { CircuitBreakerManager } from './pages/CircuitBreakerManager';
import { WaitingRoomManager } from './pages/WaitingRoomManager';
import { ResourcesManager } from './pages/ResourcesManager';
import { ComplianceManager } from './pages/ComplianceManager';
import { SponsorshipsManager } from './pages/SponsorshipsManager';
import { UserSegmentation } from './pages/UserSegmentation';
import PlatformSettings from './pages/dashboard/PlatformSettings';
import { SsoInvitePage } from './pages/SsoInvitePage';
import { ModerationManager } from './pages/ModerationManager';
import { RBACManager } from './pages/RBACManager';
import { BackupsManager } from './pages/BackupsManager';
import { UserEngagementReport } from './pages/UserEngagementReport';
import { SecurityCenter } from './pages/SecurityCenter';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { ComprehensiveAnalytics } from './pages/ComprehensiveAnalytics';
import { EventAnalytics } from './pages/EventAnalytics';
import { EventRegistrations } from './pages/EventRegistrations';
import { EventScanner } from './pages/EventScanner';
import { EventAttendanceReport } from './pages/EventAttendanceReport';
import { FunnelAnalysis } from './pages/FunnelAnalysis';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { UserEngagementReport } from './pages/UserEngagementReport';
import './styles/admin.css';

import ScheduledReports from './pages/dashboard/ScheduledReports';
import './styles/admin.css';
function RequireAuth() {
  const { isLoading, isVerified } = useAuth();

  if (isLoading) {
    return (
      <div className="login-bg">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <span className="brand-dot lg" style={{ display: 'block', margin: '0 auto 1rem' }} />
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
    onToggleShortcutsHelp: () => setIsShortcutsHelpOpen(prev => !prev),
  });


  return (
    <div className="app-layout">
      <OfflineBanner />
      <ImpersonationBanner />
      <Sidebar />
      <main className="main-content" id="main-content" style={{ paddingBottom: '88px' }}>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading module...</div>}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <MobileBottomNav />
      <Toast />
      <OnboardingTour />
      <CommandMenu isOpen={isCommandMenuOpen} onClose={() => setIsCommandMenuOpen(false)} />
      <CommandMenu isOpen={isShortcutsHelpOpen} onClose={() => setIsShortcutsHelpOpen(false)} isHelpMode={true} />
    </div>
  );
}
import { BrowserRouter } from 'react-router-dom';
import DashboardIndex from './DashboardIndex';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard/settings" element={<PlatformSettings />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/dashboard/project-health" element={<ProjectHealthDashboard />} />
            <Route path="/dashboard/analytics" element={<ComprehensiveAnalytics />} />
            <Route path="/dashboard/analytics/funnel" element={<FunnelAnalysis />} />
            <Route path="/dashboard/analytics/custom-events" element={<CustomEventTracking />} />
            <Route path="/dashboard/events" element={<EventsManager />} />
            <Route path="/dashboard/event-registrations" element={<EventRegistrations />} />
            <Route path="/dashboard/event-scanner" element={<EventScanner />} />
            <Route path="/dashboard/event-analytics" element={<EventAnalytics />} />
            <Route path="/dashboard/reports/attendance" element={<EventAttendanceReport />} />
            <Route path="/dashboard/activity-events" element={<ActivityEventsManager />} />
            <Route path="/dashboard/core-team" element={<CoreTeamManager />} />
            <Route path="/dashboard/membership" element={<MembershipResponsesManager />} />
            <Route path="/dashboard/sync-monitor" element={<SyncMonitor />} />
            <Route path="/dashboard/recruitment" element={<RecruitmentResponsesManager />} />
            <Route path="/dashboard/certificates" element={<CertificateManager />} />
            <Route path="/dashboard/announcements" element={<AnnouncementsManager />} />
            <Route path="/dashboard/portfolios" element={<PortfolioManager />} />
            <Route path="/dashboard/forum" element={<ForumManager />} />
            <Route path="/dashboard/mentorship" element={<MentorshipManager />} />
            <Route path="/dashboard/streams" element={<StreamManager />} />
            <Route path="/dashboard/circuit-breaker" element={<CircuitBreakerManager />} />
            <Route path="/dashboard/waiting-room" element={<WaitingRoomManager />} />
            <Route path="/dashboard/groups" element={<UserGroups />} />
            <Route path="/dashboard/roles" element={<RolesManager />} />
            <Route path="/dashboard/tasks" element={<ScheduledTasksManager />} />
            <Route path="/dashboard/backups" element={<BackupsManager />} />
            <Route path="/dashboard/resources" element={<ResourcesManager />} />
            <Route path="/dashboard/compliance" element={<ComplianceManager />} />
            <Route path="/dashboard/sponsorships" element={<SponsorshipsManager />} />
            <Route path="/dashboard/audit-logs" element={<AuditLogViewer />} />
            <Route path="/dashboard/reports" element={<UserEngagementReport />} />
            <Route path="/dashboard/security" element={<SecurityCenter />} />
            <Route path="/dashboard/reports" element={<UserEngagementReport />} />
            <Route path="/dashboard/sponsorships" element={<SponsorshipsManager />} />
            <Route path="/dashboard/audit-logs" element={<AuditLogViewer />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
