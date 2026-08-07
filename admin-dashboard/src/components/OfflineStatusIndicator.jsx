import { AdminIcon } from "./AdminIcon";

export function OfflineStatusIndicator({
  isOffline,
  pendingCount,
  onSync,
  isSyncing,
}) {
  if (!isOffline && pendingCount === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        background: isOffline ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
        border: `1px solid ${isOffline ? "var(--admin-warning, #eab308)" : "var(--admin-success, #22c55e)"}40`,
        borderRadius: 8,
        marginBottom: 20,
        color: "var(--admin-text, #eee)",
      }}
    >
      <AdminIcon
        name={isOffline ? "WifiOff" : "Wifi"}
        size={20}
        style={{
          color: isOffline
            ? "var(--admin-warning, #eab308)"
            : "var(--admin-success, #22c55e)",
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>
          {isOffline ? "Offline Mode Active" : "Online"}
        </div>
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--admin-text-muted, #888)",
          }}
        >
          {pendingCount > 0
            ? `${pendingCount} pending check-in${pendingCount !== 1 ? "s" : ""} to sync.`
            : "All data is synced."}
        </div>
      </div>
      {!isOffline && pendingCount > 0 && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="btn-primary"
          style={{ padding: "6px 12px", fontSize: "0.85rem" }}
        >
          {isSyncing ? "Syncing..." : "Sync Now"}
        </button>
      )}
    </div>
  );
}
