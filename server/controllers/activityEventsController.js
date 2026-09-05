import { activityEventsService } from '../services/activityEventsService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      res.status(500).json({ error: e?.message || 'Internal server error' });
    });
}

export const listActivityEvents = wrapAsync(async (req, res) => {
  const activityKey = String(req.params.activityKey || '').trim();
  const events = await activityEventsService.listActivityEvents(activityKey);
  return res.json({ events });
});

export const addActivityEvent = wrapAsync(async (req, res) => {
  const activityKey = String(req.params.activityKey || '').trim();
  const result = await activityEventsService.addActivityEvent(activityKey, req.body);
  return res.status(201).json({ ok: true, event: result });
});

export const deleteActivityEvent = wrapAsync(async (req, res) => {
  const activityKey = String(req.params.activityKey || '').trim();
  const eventId = String(req.params.eventId || '').trim();
  await activityEventsService.assertCanManage(req.body);
  const deleted = await activityEventsService.deleteActivityEvent(activityKey, eventId);
  if (!deleted) return res.status(404).json({ error: 'Event not found in manual activity events.' });
  return res.json({ ok: true });
});

