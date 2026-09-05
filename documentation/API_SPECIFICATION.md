# NexaSphere API specification

The Express service persists a local JSON fallback at `server/data/content.json` and can mirror submissions to configured external services.

## Public endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/content/events` | List public event records. |
| `GET` | `/api/content/activity-events/:activityKey` | List events for an activity. |
| `POST` | `/api/forms/membership` | Submit a membership application. |
| `POST` | `/api/forms/recruitment` | Submit a core-team application. |
| `POST` | `/api/core-team/apply` | Compatibility endpoint for core-team applications. |

Application payloads require `fullName`, `collegeEmail`, and `whatsapp`. They are stored with a generated id, ISO submission timestamp, and an initial `pending` status.

## Admin endpoints

Admin application endpoints require a bearer token obtained from the configured admin login flow. Status updates accept only `pending`, `accepted`, `rejected`, or `blacklisted`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/membership-apps` | List membership applications. |
| `PUT` | `/api/admin/membership-apps/:id` | Update a membership status. |
| `DELETE` | `/api/admin/membership-apps/:id` | Delete a membership application. |
| `GET` | `/api/admin/coreteam-apps` | List core-team applications. |
| `PUT` | `/api/admin/coreteam-apps/:id` | Update a core-team status. |
| `DELETE` | `/api/admin/coreteam-apps/:id` | Delete a core-team application. |
