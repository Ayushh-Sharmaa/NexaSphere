# data/
All site content lives here — edit these files to update the website without touching any component code.

## Files

| File | Edit to... |
|---|---|
| `teamData.js` | Add / update core team members |
| `activitiesData.js` | Change activity card icons & descriptions (home grid) |
| `eventsData.js` | Add events to the home page timeline + Events page |
| `activities/index.js` | Register a new activity page |
| `activities/workshop.js` | Add / update Workshop events |
| `activities/insightSession.js` | Add / update KSS & Insight Session events |
| `activities/hackathon.js` | Add / update Hackathon events |

---

## How to add a new event to the Home / Events page

Open `eventsData.js` and add a new object to the `events` array:

```js
{
  id: 4,                          // next sequential number
  name: 'Your Event Name',
  shortName: 'Short Name',
  date: 'April 2025',
  description: 'One paragraph description.',
  status: 'upcoming',             // 'upcoming' | 'completed'
  icon: '🚀',
  tags: ['Tag1', 'Tag2'],
}
```

---

## How to add an upcoming Workshop event

Open `activities/workshop.js` → add to `upcomingEvents`:

```js
{
  id: 'workshop-your-id',
  name: 'Workshop: Topic Name',
  shortName: 'Topic Name',
  date: 'Coming Soon',            // or 'April 15, 2025'
  status: 'upcoming',
  description: 'What attendees will learn.',
  tags: ['Tag1', 'Tag2'],
}
```

---

## How to add an upcoming Insight Session

Open `activities/insightSession.js` → add to `upcomingEvents`:

```js
{
  id: 'industry-insider-career',
  name: 'Session Title',
  shortName: 'Short Name',
  date: 'March 13',
  status: 'upcoming',
  description: 'Session description.',
  tags: ['Career', 'Guidance'],
}
```

When the session is conducted, move it to `conductedEvents` and fill in speakers, topics, volunteers, etc.

---

## Current Events (as of March 2025)

| Event | Status | File |
|---|---|---|
| KSS #153 — Impact of AI | ✅ Completed | `activities/insightSession.js` |
| Industry Insider — Career Guidance | 🔜 March 13 | `activities/insightSession.js` + `eventsData.js` |
| Workshop: Git & GitHub | 🔜 Coming Soon | `activities/workshop.js` + `eventsData.js` |
