Closes #1509

### Description

This PR addresses the Role-Based Access Control (RBAC) Refinement issue by implementing more granular roles.

### Changes Made

- **Predefined Roles Added**:
  - `EventManager`: Full access to manage events, attendees, and related analytics.
  - `ContentModerator`: Access to moderate content, feature posts, and delete inappropriate content.
  - `AnalyticsViewer`: Read-only access specifically scoped for viewing and exporting analytics.
- **Permission Matrix Configuration**: Configured the appropriate permissions for each of the new roles inside `DEFAULT_ROLES`.
- **API and UI Alignment**: Updated `ALLOWED_ROLES` in the users controller so the backend acknowledges the new roles correctly during assignment and validation.

These changes integrate seamlessly into the existing `RBACManager` dashboard for assigning roles and checking the updated permission matrix.
