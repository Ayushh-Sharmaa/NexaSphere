export function Skeleton({
  height = 48,
  width = "100%",
  count = 1,
  rounded = false,
  animate = true,
}) {
  const safeCount = Math.max(1, count || 1);
  return (
    <>
      {Array.from({ length: safeCount }).map((_, i) => (
        <div
          key={i}
          className={`skeleton${animate ? " skeleton-shimmer" : ""}${rounded ? " skeleton-rounded" : ""}`}
          style={{
            height,
            width,
            marginBottom: i < safeCount - 1 ? "8px" : 0,
            borderRadius: rounded ? "50%" : undefined,
          }}
          aria-hidden="true"
          role="presentation"
        />
      ))}
    </>
  );
}

export function SkeletonText({ lines = 3, animate = true, width = "100%" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`skeleton${animate ? " skeleton-shimmer" : ""}`}
          style={{
            height: 14,
            width: i === lines - 1 ? "60%" : width,
            borderRadius: "4px",
          }}
          aria-hidden="true"
          role="presentation"
        />
      ))}
    </div>
  );
}
