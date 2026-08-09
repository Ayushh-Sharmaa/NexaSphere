# Event Feedback & Rating System with NPS

## Overview

Post-event feedback system with multi-dimensional star ratings, NPS scoring, open-ended questions, automated email triggers, gamification rewards, and an organiser analytics dashboard.

## Architecture

```
components/Feedback/
  FeedbackForm.jsx        — Attendee-facing form (quick + detailed modes)
  OrganizerDashboard.jsx  — Real-time analytics, export, NPS gauge

server/routes/
  feedback.js             — POST /api/feedback, GET analytics, export, check

server/services/
  feedbackAnalytics.js    — NPS calc, theme extraction, distribution, trends
  feedbackScheduler.js    — Cron: auto-email 1h after event, reminder at 25h
```

## Environment Variables

```env
APP_URL=https://nexasphere.example.com
EMAIL_FROM=noreply@nexasphere.example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

## Database Schema

```sql
CREATE TABLE feedback (
  id              SERIAL PRIMARY KEY,
  event_id        INTEGER NOT NULL REFERENCES events(id),
  user_id         INTEGER NOT NULL REFERENCES users(id),
  anonymous       BOOLEAN DEFAULT FALSE,
  rating_overall  SMALLINT CHECK (rating_overall BETWEEN 1 AND 5),
  rating_content  SMALLINT,
  rating_speaker  SMALLINT,
  rating_venue    SMALLINT,
  rating_logistics SMALLINT,
  rating_networking SMALLINT,
  rating_value    SMALLINT,
  nps_score       SMALLINT CHECK (nps_score BETWEEN 0 AND 10),
  nps_category    TEXT CHECK (nps_category IN ('detractor','passive','promoter')),
  open_enjoyed    TEXT,
  open_improve    TEXT,
  open_comments   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE TABLE feedback_schedule (
  event_id        INTEGER PRIMARY KEY REFERENCES events(id),
  first_email_at  TIMESTAMPTZ NOT NULL,
  reminder_at     TIMESTAMPTZ NOT NULL,
  first_sent      BOOLEAN DEFAULT FALSE,
  reminder_sent   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

## Setup

1. Run migrations above.
2. Register routes in `server/app.js`:

   ```js
   const feedbackRoutes = require('./routes/feedback');
   app.use('/api/feedback', feedbackRoutes);
   ```

3. Start the scheduler in `server/index.js`:

   ```js
   const { startScheduler } = require('./services/feedbackScheduler');
   startScheduler();
   ```

4. Call `scheduleFeedbackForEvent(eventId)` whenever an event is created or end_time is updated.

## API Reference

| Method | Path                                            | Description                     |
| ------ | ----------------------------------------------- | ------------------------------- |
| POST   | `/api/feedback`                                 | Submit feedback (awards +25 XP) |
| GET    | `/api/feedback/analytics/:eventId`              | Organiser analytics             |
| GET    | `/api/feedback/export/:eventId?format=csv\|pdf` | Download export                 |
| GET    | `/api/feedback/check/:eventId`                  | Has current user submitted?     |

## NPS Calculation

- **Detractors**: score 0–6
- **Passives**: score 7–8
- **Promoters**: score 9–10
- **NPS** = (% Promoters − % Detractors) × 100 → range −100 to +100

## Gamification

| Trigger                  | Reward                    |
| ------------------------ | ------------------------- |
| First feedback submitted | +25 XP                    |
| 5th feedback submitted   | "Feedback Champion" badge |

## Acceptance Criteria Coverage

| #   | Criterion                                     | Implementation                                           |
| --- | --------------------------------------------- | -------------------------------------------------------- |
| 1   | Feedback form sends automatically after event | `feedbackScheduler.js` cron, 1h after `end_time`         |
| 2   | All rating dimensions collected               | 7 dimensions in `FeedbackForm.jsx` + DB columns          |
| 3   | NPS calculated correctly                      | `calculateNPS()` in `feedbackAnalytics.js`               |
| 4   | Open-ended responses captured                 | 3 text fields stored in `open_enjoyed/improve/comments`  |
| 5   | Analytics dashboard accurate                  | `OrganizerDashboard.jsx` → `/api/feedback/analytics/:id` |
| 6   | Response rate > 40%                           | Tracked in analytics; scheduler drives participation     |
| 7   | Reminder emails increase participation        | 24h reminder skips already-submitted users               |
| 8   | Organiser can view and export feedback        | Dashboard + CSV/PDF export endpoint                      |
| 9   | Incentives encourage feedback                 | +25 XP on submit; badge at 5 submissions                 |
| 10  | QA test full feedback flow                    | Duplicate guard (409), validation, full happy-path route |
