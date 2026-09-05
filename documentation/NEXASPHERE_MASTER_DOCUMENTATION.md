# NexaSphere platform overview

NexaSphere is a path-routed React SPA for the GL Bajaj student technology community. Its primary public routes are `/home`, `/activities`, `/events`, `/about`, `/team`, `/contact`, `/membership`, and `/recruitment`; `/apply` remains a recruitment alias.

The client uses named SVG icons through `src/shared/Icons.jsx`, not presentation emojis in its activity and event data. Membership and core-team forms persist immediately in browser storage, synchronise with their API endpoints when available, and expose their submissions in the `/admin` control panel. The dashboard supports review, detail inspection, CSV export, accepted/rejected/blacklisted status actions, deletion, and rich event publishing.

See [API_SPECIFICATION.md](API_SPECIFICATION.md) and [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for implementation and deployment details.
