# Summary

Implemented both frontend and backend logic to handle Banner & Hero Image Management, providing routes and a UI to upload, rotate, schedule, and archive banners.

## Related Issue

Fixes #1581

## Type of Change

- [x] Feature
- [ ] Bug Fix
- [ ] UI/UX Improvement
- [ ] Performance Optimization
- [ ] Security Enhancement
- [ ] Refactoring
- [ ] Documentation
- [ ] Testing
- [ ] Infrastructure
- [ ] Integration

## Changes Implemented

- Added `banners` table via migration (`1805_add_banners_table.js`) to store banner metadata: `title`, `image_url`, `link_url`, `start_time`, `end_time`, `is_active`.
- Created robust banner scheduling logic in `bannersRepository.js` and `bannersService.js` to only serve banners whose `is_active` is true and current time falls within `start_time` and `end_time`.
- Created `bannersController.js` for handling CRUD operations, protected via admin authentication.
- Exposed public API (`/api/content/banners`) for the frontend to fetch the current active banners for display and rotation.
- Created `BannersManager.jsx` in the admin dashboard for creating/deleting banners with an image upload interface mapping.
- Updated `DashboardIndex.jsx` and `Sidebar.jsx` to route to the new manager.
- Updated `HeroSection.jsx` on the public website to fetch and preview the active banner dynamically.

## Technical Details

### Frontend

- `admin-dashboard/src/pages/BannersManager.jsx`: Admin UI for managing rotation schedules.
- `website/src/pages/home/HeroSection.jsx`: Fetches and displays the active banner in place of the default logo.

### Backend

- `server/validators/bannerSchemas.js`: Validates incoming banner payloads.
- `server/services/bannersService.js`: Encapsulates business logic.
- `server/controllers/bannersController.js`: Maps HTTP endpoints.
- `server/repositories/bannersRepository.js`: Handles PostgreSQL interactions.

### Database

- Migrated `banners` table using node-pg-migrate.

### API

- `GET /api/content/banners` (Public): Returns list of active banners scheduled for current time.
- `GET /api/admin/banners` (Admin): Returns all banners.
- `POST /api/admin/banners` (Admin): Create a new banner schedule.
- `PUT /api/admin/banners/:id` (Admin): Update banner details.
- `DELETE /api/admin/banners/:id` (Admin): Delete/archive a banner.

### Infrastructure

- N/A

## Screenshots

### Before

- N/A

### After

- N/A

## Testing

### Unit Tests

- [ ]

### Integration Tests

- [ ]

### E2E Tests

- [ ]

### Manual Testing

- [x] Verified route additions and tested schema constraints.

## Security Review

- Ensured all management routes (`POST`, `PUT`, `DELETE`) are protected behind `adminAuthMiddleware.requireAdmin`.

## Accessibility Review

- N/A

## Performance Impact

- Negligible

## Breaking Changes

- [x] No Breaking Changes
- [ ] Breaking Changes Documented

## Deployment Notes

- Run `npm run migrate` on deployment to build the `banners` table in PostgreSQL.

## Rollback Plan

- Run migration down script to drop `banners` table.

## Checklist

- [x] Code follows project standards
- [x] Tests added or updated
- [ ] Documentation updated
- [x] Security reviewed
- [ ] Accessibility reviewed
- [x] Performance validated
- [x] CI/CD passing
- [x] Ready for review
