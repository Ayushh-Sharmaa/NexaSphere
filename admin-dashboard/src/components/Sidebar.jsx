import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AdminIcon } from "./AdminIcon";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { PermissionGuard } from "./PermissionGuard";

/* Public website URL */
const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL || "http://localhost:5175";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "Dashboard" },
  { to: "/dashboard/project-health", label: "Project Health", icon: "Shield" },
  { to: "/dashboard/analytics", label: "Analytics", icon: "BarChart" },
  {
    to: "/dashboard/analytics/funnel",
    label: "Funnel Analysis",
    icon: "TrendingDown",
  },
  {
    to: "/dashboard/analytics/custom-events",
    label: "Custom Events",
    icon: "Target",
  },
  {
    to: "/dashboard/events",
    label: "Events",
    icon: "Calendar",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/waiting-room",
    label: "Waiting Room",
    icon: "Clock",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/event-registrations",
    label: "Registrations",
    icon: "FileText",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/event-scanner",
    label: "Scanner",
    icon: "Camera",
    requiredScope: "events:write",
  },
  {
    to: "/dashboard/event-analytics",
    label: "Analytics",
    icon: "BarChart",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/activity-events",
    label: "Activity Events",
    icon: "Target",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/core-team",
    label: "Core Team",
    icon: "Users",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/roles",
    label: "User Roles",
    icon: "Shield",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/users",
    label: "Users",
    icon: "Users",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/applications",
    label: "Applications (NX-MEM/CORE)",
    icon: "FileText",
  },
  { to: "/dashboard/membership", label: "Membership", icon: "FileText" },
  { to: "/dashboard/sync-monitor", label: "Sync Monitor", icon: "Database" },
  { to: "/dashboard/recruitment", label: "Recruitment", icon: "UserPlus" },
  { to: "/dashboard/certificates", label: "Certificates", icon: "Award" },
  { to: "/dashboard/announcements", label: "Announcements", icon: "Megaphone" },
  {
    to: "/dashboard/banners",
    label: "Banners (Hero)",
    icon: "Image",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/forum",
    label: "Forum",
    icon: "FileText",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/streams",
    label: "Live Streams",
    icon: "Camera",
  },
  {
    to: "/dashboard/circuit-breaker",
    label: "Circuit Breaker",
    icon: "Activity",
  },
  {
    to: "/dashboard/qa-poll",
    label: "Q&A / Polling",
    icon: "MessageSquare",
    requiredScope: "events:read",
  },
  {
    to: "/dashboard/tasks",
    label: "Scheduled Tasks",
    icon: "Clock",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/audit-logs",
    label: "Audit Logs",
    icon: "FileText",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/backups",
    label: "Backups / Restore",
    icon: "Database",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/reports",
    label: "Reports",
    icon: "Target",
    requiredScope: "settings:admin",
  },
  {
    to: "/dashboard/settings",
    label: "Platform Settings",
    icon: "Settings",
    requiredScope: "settings:admin",
  },
];

export function Sidebar() {
  const { email, logout } = useAuth();

  const location = useLocation();

  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("ns-admin-theme", newTheme);

    setTheme(newTheme);
  };

  const sidebarRef = useRef(null);

  const hamburgerRef = useRef(null);

  const firstNavLinkRef = useRef(null);

  const close = () => {
    setOpen(false);

    // Restore focus to hamburger button
    hamburgerRef.current?.focus();
  };

  // Focus first link when sidebar opens
  useEffect(() => {
    if (open) {
      firstNavLinkRef.current?.focus();
    }
  }, [open]);

  // ESC closes sidebar
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && open) {
        close();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Trap focus inside mobile sidebar
  useEffect(() => {
    if (!open || !sidebarRef.current) return;

    const focusableElements = sidebarRef.current.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];

    const lastElement = focusableElements[focusableElements.length - 1];

    function trapFocus(event) {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();

          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();

          firstElement.focus();
        }
      }
    }

    document.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", trapFocus);
    };
  }, [open]);

  return (
    <>
      {/* Mobile Hamburger */}

      <button
        ref={hamburgerRef}
        className="sidebar-hamburger"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="admin-sidebar"
        onClick={() => setOpen((o) => !o)}
      >
        <span className={`ham-line${open ? " open" : ""}`} />

        <span className={`ham-line${open ? " open" : ""}`} />

        <span className={`ham-line${open ? " open" : ""}`} />
      </button>

      {/* Mobile Backdrop */}

      {open && (
        <div className="sidebar-backdrop" onClick={close} aria-hidden="true" />
      )}

      <aside
        id="admin-sidebar"
        ref={sidebarRef}
        className={`sidebar${open ? " sidebar-open" : ""}`}
        role="navigation"
        aria-label="Admin Sidebar Navigation"
      >
        {/* Branding */}

        <div className="sidebar-brand">
          <span className="brand-dot" aria-hidden="true" />

          <span>NexaSphere Admin</span>
        </div>

        {/* Back To Website */}

        <a
          href={WEBSITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-back-link"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            fontSize: "0.75rem",
            color: "var(--admin-text-muted, #888)",
            textDecoration: "none",
            borderBottom:
              "1px solid var(--admin-border, rgba(255,255,255,0.06))",
            marginBottom: "8px",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--admin-accent, #CC1111)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--admin-text-muted, #888)")
          }
        >
          <AdminIcon name="ArrowLeft" size={12} aria-hidden="true" />
          Back to Website
        </a>

        {/* Navigation */}

        <div
          className="sidebar-search-container"
          style={{ padding: "0 16px", marginBottom: "16px" }}
        >
          <button
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
              });
              window.dispatchEvent(event);
            }}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              padding: "8px 12px",
              borderRadius: "6px",
              color: "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AdminIcon name="Search" size={16} />
              Search...
            </span>
            <kbd
              style={{
                background: "var(--bg-primary)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              Cmd+K
            </kbd>
          </button>
        </div>

        <nav className="sidebar-nav">
          {links.map(({ to, label, icon, requiredScope, external }) => {
            const LinkElement = external ? (
              <a
                key={to}
                href={to}
                target="_blank"
                rel="noreferrer"
                className="nav-link"
                onClick={close}
              >
                <AdminIcon name={icon} size={16} aria-hidden="true" />
                {label}
                <AdminIcon
                  name="ExternalLink"
                  size={12}
                  style={{ marginLeft: "auto", opacity: 0.5 }}
                />
              </a>
            ) : (
              <NavLink
                key={to}
                to={to}
                end={to === "/dashboard"}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
                aria-current={({ isActive }) => (isActive ? "page" : undefined)}
                onClick={close}
                data-tour={label.toLowerCase()}
              >
                <AdminIcon name={icon} size={16} aria-hidden="true" />
                {label}
              </NavLink>
            );

            if (requiredScope) {
              return (
                <PermissionGuard key={to} requiredScope={requiredScope}>
                  {LinkElement}
                </PermissionGuard>
              );
            }
            return LinkElement;
          })}
        </nav>

        {/* Footer */}

        <div className="sidebar-footer">
          <span className="sidebar-email" aria-label={`Logged in as ${email}`}>
            {email}
          </span>
          <button
            className="btn-logout"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{ marginBottom: "10px" }}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>

          <button
            className="btn-logout"
            onClick={logout}
            aria-label={`Logout ${email}`}
            style={{ marginTop: "10px" }}
          >
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
