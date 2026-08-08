import { adminAuthMiddleware } from '../adminAuthMiddleware.js';
import { requireStudentAuth } from '../studentAuthMiddleware.js';

export function requireNotificationPrefAuth(req, res, next) {
  adminAuthMiddleware.requireAdmin(req, res, (err) => {
    if (!err && req.adminSession) {
      return next();
    }
    requireStudentAuth(req, res, (err2) => {
      if (err2 || !req.studentUser) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
      }
      const userId =
        req.method === 'GET' ? req.query.userId || 'global' : req.body.userId || 'global';
      if (req.studentUser.sub === userId || req.studentUser.id === userId) {
        return next();
      }
      return res
        .status(403)
        .json({ error: "Forbidden: You cannot access or modify other users' preferences" });
    });
  });
}

export function requireMentorshipAuth(req, res, next) {
  adminAuthMiddleware.requireAdmin(req, res, (err) => {
    if (!err && req.adminSession) {
      return next();
    }
    requireStudentAuth(req, res, (err2) => {
      if (!err2 && req.studentUser) {
        return next();
      }
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    });
  });
}
