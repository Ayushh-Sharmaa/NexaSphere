import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { auth } from './services/auth';
import { Sidebar } from './components/Sidebar';
import { Toast } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { DashboardHome } from './pages/DashboardHome';
import { EventsManager } from './pages/EventsManager';
import { ActivityEventsManager } from './pages/ActivityEventsManager';
import { CoreTeamManager } from './pages/CoreTeamManager';
import { MembershipApplicationsManager } from './pages/MembershipApplicationsManager';
import { CoreTeamApplicationsManager } from './pages/CoreTeamApplicationsManager';
import '../../styles/admin.css';

function RequireAuth() {
  return auth.isAuthenticated() ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

function DashboardLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}

// Mounted at /admin/* by the main app router.
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="events" element={<EventsManager />} />
          <Route path="activity-events" element={<ActivityEventsManager />} />
          <Route path="core-team" element={<CoreTeamManager />} />
          <Route path="membership-apps" element={<MembershipApplicationsManager />} />
          <Route path="coreteam-apps" element={<CoreTeamApplicationsManager />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={auth.isAuthenticated() ? '/admin' : '/admin/login'} replace />} />
    </Routes>
  );
}
