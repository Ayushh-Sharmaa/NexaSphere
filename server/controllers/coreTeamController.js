import { coreTeamService } from '../services/coreTeamService.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      res.status(500).json({ error: e?.message || 'Internal server error' });
    });
}

export const adminListCoreTeamMembers = wrapAsync(async (req, res) => {
  const members = await coreTeamService.listMembers();
  return res.json({ members });
});

export const adminAddCoreTeamMember = wrapAsync(async (req, res) => {
  const member = await coreTeamService.addMember(req.body);
  return res.status(201).json({ ok: true, member });
});

export const adminDeleteCoreTeamMember = wrapAsync(async (req, res) => {
  const id = String(req.params.id || '').trim();
  const deleted = await coreTeamService.deleteMember(id);
  if (!deleted) return res.status(404).json({ error: 'Member not found' });
  return res.json({ ok: true });
});

