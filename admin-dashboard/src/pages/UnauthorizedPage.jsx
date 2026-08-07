import { useNavigate } from "react-router-dom";
import { adminPath } from "../utils/adminBasePath";

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="login-bg">
      <div className="login-card" style={{ textAlign: "center" }}>
        <div className="login-logo">
          <span className="brand-dot lg" />
        </div>
        <h1 className="login-title" style={{ fontSize: "2rem" }}>
          403
        </h1>
        <p className="login-sub" style={{ marginBottom: "1.5rem" }}>
          Access Denied — you are not authorized to view this page.
        </p>
        <button
          className="btn-primary full-width"
          onClick={() => navigate(adminPath("/login"), { replace: true })}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
