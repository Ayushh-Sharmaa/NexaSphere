// ── NexaSphere Activity Pages — Master Index ──
// Each activity lives in its own file.
// To add a new activity: create a new file here, import it, and add it to activityPages.
// To update an activity's events: edit ONLY that activity's file.

import hackathon from './hackathon';
import codathon from './codathon';
import ideathon from './ideathon';
import promptathon from './promptathon';
import workshop from './workshop';
import insightSession from './insightSession';
import openSourceDay from './openSourceDay';
import techDebate from './techDebate';

// Keys must exactly match the activity title in src/data/activitiesData.js
export const activityPages = {
  'Hackathon':       hackathon,
  'Codathon':        codathon,
  'Ideathon':        ideathon,
  'Promptathon':     promptathon,
  'Workshop':        workshop,
  'Insight Session': insightSession,
  'Open Source Day': openSourceDay,
  'Tech Debate':     techDebate,
};
