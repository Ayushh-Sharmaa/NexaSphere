# TODO: Add Search Functionality to Events Page

## Steps

- [x] Plan approved by user
- [x] 1. Edit `src/pages/events/EventsPage.jsx` - Add search state, filtering logic, search input UI, and empty state
- [x] 2. Edit `src/__tests__/EventsPage.test.tsx` - Add test cases for search functionality
- [ ] 3. Run tests to verify implementation (waiting for npm install to complete)

- [ ] Update service worker (`website/src/sw-nexasphere.js`) to persist/caches key dynamic reads longer (events, announcements, leaderboard, profile, portfolio)
- [ ] Ensure dynamic offline reads fall back to IndexedDB when offline
- [ ] Audit `setupFetchInterceptor()` and confirm offline draft registration enqueues via `enqueueRequest()`
- [ ] Ensure background sync replay works for queued registrations (manual + SW-triggered)
- [ ] Validate update management flow (prompt/reload behavior) doesn’t interrupt active session
- [ ] Run website build + unit tests
- [ ] Run e2e tests that cover offline/registration flows (if feasible)

# TODO - Event Stream Processing & Real-Time Analytics (#1776)

# NexaSphere Monorepo TODO Checklist

This file tracks the status of major features and integrations planned for NexaSphere.

---

## 1. Event Stream Processing & Real-Time Analytics (#1776)

# TODO - Event Stream Processing & Real-Time Analytics (#1776)

# NexaSphere Monorepo TODO Checklist

This file tracks the status of major features and integrations planned for NexaSphere.

---

## 1. Event Stream Processing & Real-Time Analytics (#1776)

- [ ] Create plan + confirm approach (done)
- [ ] Add streaming abstraction layer (Queue interface + implementations)
- [ ] Add outbox dispatcher worker (poll outbox, publish, mark delivered, idempotency)
- [ ] Wire dispatcher into server startup
- [ ] Update eventPublisher to enqueue to outbox before publish (or ensure consistent flow)
- [ ] Ensure tests use MockQueue + mock outbox without DB dependency
- [ ] Expand StreamProcessor windowing/hourly + richer dashboard payload
- [ ] Implement fraud rules (IP/payment) + enforcement
- [ ] Implement real-time recommendation regeneration pipeline
- [ ] Persist processed analytics for historical queries
- [ ] Extend QA tests to cover outbox delivery, ordering, aggregates, anomaly, fraud, recommendations

---

## 2. Real-Time Collaborative Whiteboard (#1754)

- [ ] Create a minimal viable whiteboard component (canvas-based) with: pen/highlighter/eraser, shapes (rect/circle/triangle/line/arrow), text boxes, sticky notes, undo/redo per user.
- [ ] Implement event-linked whiteboard room routing + persistence (load/save state, autosave every 30s).
- [ ] Add real-time collaboration layer using existing socket infrastructure (Pusher/SocketProvider) and CRDT/operation log approach.
- [ ] Add presence indicators (colored cursors with names), pointer/laser tool, follow mode (presenter).
- [ ] Add templates (Kanban, mindmap, flowchart, SWOT, lean canvas) pre-populating initial state.
- [ ] Implement sticky note voting (each participant has 3 votes), reveal mode, grouping, summary generation.
- [ ] Implement export service: PNG, SVG, PDF.
- [ ] Add performance optimizations: pan/zoom smooth, lazy loading for large boards, ensure 1000+ elements handling.
- [ ] Mobile/touch drawing support.
- [ ] Add QA/concurrency test plan + minimal automated tests where possible.
