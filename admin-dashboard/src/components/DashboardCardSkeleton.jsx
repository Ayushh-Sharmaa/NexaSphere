export function DashboardCardSkeleton() {
  return (
    <div className="stat-card skeleton-card">
      <div
        className="skeleton"
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      />

      <div
        className="skeleton"
        style={{
          width: "60px",
          height: "24px",
          marginBottom: "10px",
        }}
      />

      <div
        className="skeleton"
        style={{
          width: "120px",
          height: "14px",
        }}
      />
    </div>
  );
}
