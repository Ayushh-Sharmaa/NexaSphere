# activities/
One file per activity type. Each file exports a default object.

## Structure

```js
const activity = {
  id: 'unique-id',
  icon: '🔧',
  title: 'Activity Title',          // must match activitiesData.js key
  tagline: 'One line tagline',
  color: '#10b981',
  gradient: 'linear-gradient(...)',
  description: 'Full description',

  conductedEvents: [ /* completed events with full detail */ ],
  upcomingEvents:  [ /* announced / coming soon events   */ ],
};
```

## Current status

| File | Conducted | Upcoming |
|---|---|---|
| `insightSession.js` | KSS #153 (March 2025) | Industry Insider — Career Guidance (March 13) |
| `workshop.js` | — | Git & GitHub · Python Basics |
| `hackathon.js` | — | — |
| `codathon.js` | — | — |
| `ideathon.js` | — | — |
| `openSourceDay.js` | — | — |
| `techDebate.js` | — | — |
| `promptathon.js` | — | — |

## Adding a completed KSS

Copy the `kss-153` block in `insightSession.js`, change the `id`, `name`, `date`, and fill in:
- `stats[]` — presenter/volunteer counts
- `overview` — paragraph description
- `topics[]` — each presenter + their topic
- `volunteers[]` — names
- `acknowledgements[]` — faculty thanks
- `photoLink` / `videoLink` — set when media is ready
