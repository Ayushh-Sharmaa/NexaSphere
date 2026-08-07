import { AdminIcon } from "./AdminIcon";

export function EmptyState({
  icon = "Inbox",
  title = "No Data Found",
  description = "There is currently nothing to display.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <AdminIcon name={icon} size={42} aria-hidden="true" />
      </div>

      <h3 className="empty-state-title">{title}</h3>

      <p className="empty-state-description">{description}</p>

      {actionLabel && (
        <button className="empty-state-btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
