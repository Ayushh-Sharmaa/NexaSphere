
const fs = require('fs');
let code = fs.readFileSync('server/controllers/mentorshipController.js', 'utf8');
code = code.replace(
  /export const listMentorships = wrapAsync\\(async \\(req, res\\) => \\{[\\s\\S]*?return res\\.json\\(\\{ mentorships: result\\.rows, total: result\\.total \\}\\);\\n\\}\\);/,
  \export const listMentorships = wrapAsync(async (req, res) => {
  if (!req.studentUser) {
    return sendError(req, res, 'Authentication required', 401, 'UNAUTHORIZED');
  }
  const { page = 1, limit = 10, status } = req.query;
  const isAdmin = req.studentUser.role === 'admin';
  const email = isAdmin && req.query.email ? req.query.email : req.studentUser.email;
  const result = await mentorshipService.listMentorships(email, status, parseInt(page), parseInt(limit));
  return res.json({ mentorships: result.rows, total: result.total });
});\
);
fs.writeFileSync('server/controllers/mentorshipController.js', code);

