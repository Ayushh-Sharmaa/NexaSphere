Fixes #1484, Fixes #1485, Fixes #1486, Fixes #1493, Fixes #1499, Fixes #1504

### Description
This PR resolves a batch of 6 issues related to UI responsiveness, accessibility, backend integrations, and bug fixes across the NexaSphere platform.

### Changes Made
- **[A11y] Issue #1484 (Mobile Nav Accessibility):** Added ESC key handlers, `aria-expanded`, and `aria-controls` for proper screen reader support and keyboard navigation in `Navbar.jsx`.
- **[UI/UX] Issue #1485 (Tablet Event Card Responsiveness):** Adjusted CSS in `components.css` to fix layout scaling and image overflow for `.timeline-card` and `.event-card` at tablet breakpoints (768px-1024px). Removed duplicate component definition in `EventCard.jsx`.
- **[A11y] Issue #1486 (Dark Mode Contrast):** Updated `--t2` and `--t3` color variables in `themes.css` and improved footer text contrast in `components.css` to meet WCAG AA standards.
- **[Feature] Issue #1493 (Collaboration Team Chat):** Created `TeamChat.jsx` frontend component and integrated real-time Socket.IO chat on the backend in `chatController.js` and `socket.js`. Added a `team_messages` Prisma migration.
- **[Bugfix] Issue #1499 (Event Form Hangs):** Handled idempotency keys securely using `sessionStorage` in `EventDetailPage.jsx` to prevent duplicate submissions on refresh. Added a 10s timeout to `apiClient` and gracefully handled offline requests.
- **[Feature] Issue #1504 (CSV Export):** Implemented client-side CSV export functionality in `EventAttendanceChart.jsx` for admins to export event attendance data directly from the browser.

### Verification
- Tested keyboard navigation and screen readers on the Mobile Navbar.
- Verified tablet resolution renders event cards gracefully without overflow.
- Confirmed Dark Mode colors pass contrast ratio checkers.
- Tested Socket.IO team chat for real-time broadcasting.
- Verified Event Registration form idempotency and timeout.
- Successfully exported CSVs from the Admin dashboard.
