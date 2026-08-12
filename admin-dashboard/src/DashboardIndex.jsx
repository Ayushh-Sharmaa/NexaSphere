import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Toast } from "./components/Toast";
import { OfflineBanner } from "./components/OfflineBanner";
import { LoginPage } from "./pages/LoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { DashboardHome } from "./pages/DashboardHome";
import { EventsManager } from "./pages/EventsManager";
import { ActivityEventsManager } from "./pages/ActivityEventsManager";
import { CoreTeamManager } from "./pages/CoreTeamManager";
import { MembershipResponsesManager } from "./pages/MembershipResponsesManager";
import { CertificateManager } from "./pages/CertificateManager";
import { AnnouncementsManager } from "./pages/AnnouncementsManager";
import { BannersManager } from "./pages/BannersManager";
import { useAuth } from "./hooks/useAuth";
import { PermissionGuard } from "./components/PermissionGuard";
import { EventRegistrations } from "./pages/EventRegistrations";
import { EventScanner } from "./pages/EventScanner";
import { EventAnalytics } from "./pages/EventAnalytics";
import { EventAttendanceReport } from "./pages/EventAttendanceReport";
import "./styles/admin.css";

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
          <p className="login-sub">Verifying session...</p>
        </div>
      </div>
    );
  }

  return isVerified ? <Outlet /> : <Navigate to="login" replace />;
}

function DashboardLayout() {
  return (
    <div className="app-layout">
      <OfflineBanner />
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}

export default function DashboardIndex() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route path="unauthorized" element={<UnauthorizedPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route
            path="dashboard/events"
            element={
              <PermissionGuard
                requiredScope="events:read"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <EventsManager />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/event-registrations"
            element={
              <PermissionGuard
                requiredScope="events:read"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <EventRegistrations />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/event-scanner"
            element={
              <PermissionGuard
                requiredScope="events:write"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <EventScanner />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/event-analytics"
            element={
              <PermissionGuard
                requiredScope="events:read"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <EventAnalytics />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/reports/attendance"
            element={
              <PermissionGuard
                requiredScope="events:read"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <EventAttendanceReport />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/activity-events"
            element={
              <PermissionGuard
                requiredScope="events:read"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <ActivityEventsManager />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/core-team"
            element={
              <PermissionGuard
                requiredScope="settings:admin"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <CoreTeamManager />
              </PermissionGuard>
            }
          />
          <Route
            path="dashboard/membership"
            element={<MembershipResponsesManager />}
          />
          <Route
            path="dashboard/certificates"
            element={<CertificateManager />}
          />
          <Route
            path="dashboard/announcements"
            element={<AnnouncementsManager />}
          />
          <Route
            path="dashboard/banners"
            element={
              <PermissionGuard
                requiredScope="settings:admin"
                fallback={<Navigate to="/unauthorized" replace />}
              >
                <BannersManager />
              </PermissionGuard>
            }
          />
          <Route path="dashboard/events" element={<EventsManager />} />
          <Route
            path="dashboard/activity-events"
            element={<ActivityEventsManager />}
          />
          <Route path="dashboard/core-team" element={<CoreTeamManager />} />
          <Route
            path="dashboard/membership"
            element={<MembershipResponsesManager />}
          />
          <Route
            path="dashboard/certificates"
            element={<CertificateManager />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="login" replace />} />
    </Routes>
  );
}
