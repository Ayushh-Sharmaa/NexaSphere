import React from "react";
import { useTheme } from "../../hooks/useTheme";
import { Sun, Moon } from "lucide-react";

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label="Toggle Theme"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        color: "var(--text-primary)",
        transition: "background-color 0.3s ease, transform 0.2s ease",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bdr)";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
      onFocus={(e) => {
        e.currentTarget.style.backgroundColor = "var(--bdr)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.9)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <div style={{ position: "relative", width: "20px", height: "20px" }}>
        <Sun
          size={20}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transition: "opacity 0.4s ease, transform 0.4s ease",
            opacity: isDark ? 0 : 1,
            transform: isDark
              ? "rotate(-90deg) scale(0.5)"
              : "rotate(0deg) scale(1)",
          }}
        />
        <Moon
          size={20}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transition: "opacity 0.4s ease, transform 0.4s ease",
            opacity: isDark ? 1 : 0,
            transform: isDark
              ? "rotate(0deg) scale(1)"
              : "rotate(90deg) scale(0.5)",
          }}
        />
      </div>
    </button>
  );
};
