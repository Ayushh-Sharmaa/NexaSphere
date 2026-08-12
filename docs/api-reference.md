# REST API Reference

Base URL (production): `https://nexasphere-api.onrender.com`
Base URL (local dev): `http://localhost:8787`

## Authentication

Most write endpoints require an admin session cookie set after calling
`POST /api/auth/login`. Activity event mutations use a separate password-based
gate (see [Activity Events](#activity-events)).

---

## Health

### `GET /health`

Returns server status. No authentication required.

**Response `200`:**

```json
{ "status": "ok" }
```

---

## Events

### `GET /api/events`

List all public events.

**Query params:**

| Param   | Type   | Default | Description      |
| ------- | ------ | ------- | ---------------- |
| `page`  | number | `1`     | Page number      |
| `limit` | number | `20`    | Results per page |
| Param    | Type   | Default | Description            |
| -------- | ------ | ------- | ---------------------- |
| `page`   | number | `1`     | Page number            |
| `limit`  | number | `20`    | Results per page       |

**Response `200`:** paginated array of event objects.

---

### `POST /api/events`

Create a new event. **Requires admin session.**

**Body (JSON):** event fields per `server/validators/eventSchemas.js`.

---

### `DELETE /api/events/:id`

Delete an event by ID. **Requires admin session.**

---

## Activity Events

Activity events are scoped under an activity key (e.g. `hackathons`).

### `GET /api/activities/:activityKey/events`

List events for a specific activity.

### `POST /api/activities/:activityKey/events`

Create an activity event. **Requires core-team gate credentials** (name, email,
phone, and `ADMIN_EVENT_PASSWORD`).

### `DELETE /api/activities/:activityKey/events/:eventId`

Delete an activity event. **Requires core-team gate credentials.**

---

## Core Team

### `GET /api/core-team`

Returns the current list of core team members.

### `POST /api/core-team`

Add a core team member. **Requires admin session.**

### `DELETE /api/core-team/:id`

Remove a core team member. **Requires admin session.**

---

## Forms & Registrations

### `GET /api/forms`

List all forms.

### `GET /api/registrations`

List all form registrations. **Requires admin session.**

---

## Users

### `GET /api/users`

List all users. **Requires admin session.**

---

## Error Responses

All errors return a standardized JSON envelope:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "traceId": "req-abc-123-def"
  }
}
```

| HTTP Status | Error Code         | Meaning                         |
| ----------- | ------------------ | ------------------------------- |
| `400`       | `VALIDATION_ERROR` | Validation error (bad input)    |
| `401`       | `UNAUTHORIZED`     | Authentication required         |
| `403`       | `FORBIDDEN`        | Forbidden (insufficient access) |
| `404`       | `NOT_FOUND`        | Resource not found              |
| `409`       | `CONFLICT`         | Conflict (duplicate, stale)     |
| `429`       | `RATE_LIMITED`     | Rate limit exceeded             |
| `500`       | `INTERNAL_ERROR`   | Internal server error           |
| `502`       | `DEPENDENCY_ERROR` | External dependency failure     |

Success responses return the data directly (no wrapper):

```json
{ "id": 1, "name": "Example" }
```

All errors return a JSON object with a `message` field:

```json
{ "message": "Unauthorized. Core team details or password did not match." }
```

| HTTP Status | Meaning                         |
| ----------- | ------------------------------- |
| `400`       | Validation error (bad input)    |
| `401`       | Authentication required         |
| `403`       | Forbidden (insufficient access) |
| `404`       | Resource not found              |
| `429`       | Rate limit exceeded             |
| `500`       | Internal server error           |
