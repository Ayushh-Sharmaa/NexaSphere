import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AdminIcon } from "./AdminIcon";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: "Dashboard" },
  { label: "Events", to: "/dashboard/events", icon: "Calendar" },
  { label: "Team", to: "/dashboard/core-team", icon: "Users" },
  { label: "Alerts", to: "/dashboard/announcements", icon: "Megaphone" },
  { label: "More", action: "open-sidebar", icon: "Wrench" },
];

function isCompactWidth() {
  return typeof window !== "undefined" ? window.innerWidth <= 860 : false;
}

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [compact, setCompact] = useState(isCompactWidth());

  useEffect(() => {
    const onResize = () => setCompact(isCompactWidth());
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activePath = useMemo(() => {
    const path = location.pathname;
    return path.startsWith("/dashboard/core-team")
      ? "/dashboard/core-team"
      : path.startsWith("/dashboard/events")
        ? "/dashboard/events"
        : path.startsWith("/dashboard/announcements")
          ? "/dashboard/announcements"
          : "/dashboard";
  }, [location.pathname]);

  if (!compact) return null;

  return (
    <nav
      aria-label="Mobile admin navigation"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 900,
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap: 0,
        padding: "8px 10px max(8px, env(safe-area-inset-bottom))",
        background: "rgba(9, 11, 18, 0.96)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(16px)",
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.to ? activePath === item.to : false;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.action === "open-sidebar") {
                window.dispatchEvent(new CustomEvent("admin:open-sidebar"));
                return;
              }
              navigate(item.to);
            }}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            style={{
              minHeight: "56px",
              background: "transparent",
              border: "none",
              color: active
                ? "var(--admin-accent, #CC1111)"
                : "var(--admin-text-muted, #bbb)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: 0,
            }}
          >
            <AdminIcon name={item.icon} size={18} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
