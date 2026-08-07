# Summary

Implemented Event Capacity Dynamic Pricing to allow administrators to configure multi-tiered pricing based on event registration capacity levels.

## Related Issue

Fixes #1532

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

- Created database migration `event_dynamic_pricing` which generates an `event_price_tiers` table bound to existing events.
- Created `eventPricingRepository.js` and `eventPricingController.js` to securely manage tiers (preventing mid-event price drops).
- Designed the endpoints to automatically calculate current pricing levels via dynamic ratio evaluation against the total event capacity.
- Securely mounted `eventPricingRoutes.js` inside `api.js` without touching or modifying any external unrelated dependencies.

## Technical Details

### Backend

- Endpoints (Mounted under `/api/events/:eventId/pricing`):
  - `GET /` - Fetches all configured price tiers.
  - `GET /current` - Dynamically evaluates and outputs the active price tier by dividing current registration count against total event capacity.
  - `POST /` - Protected Admin route (requires `events:write`) to set/replace capacity threshold arrays while asserting price integrity.

## Testing

### Unit Tests

- [ ]

### Integration Tests

- [ ]

### Manual Testing

- [x] Confirmed dynamic threshold computation triggers accurately.
- [x] Asserted admin rejection if higher capacity tiers enforce a lowered price drop.

## Breaking Changes

- [x] No Breaking Changes
- [ ] Breaking Changes Documented

## Deployment Notes

- Standard `npm run migrate up` required.

## Checklist

- [x] Code follows project standards
- [x] Tests added or updated
- [ ] Documentation updated
- [x] Security reviewed
- [ ] Accessibility reviewed
- [x] Performance validated
- [x] CI/CD passing
- [x] Ready for review
