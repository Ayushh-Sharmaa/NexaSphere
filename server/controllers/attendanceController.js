import { registrationsRepository } from '../repositories/registrationsRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { emitToRole } from '../config/socket.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

function wrapAsync(fn) {
  return (req, res) =>
    Promise.resolve(fn(req, res)).catch((e) => {
      const status = e.status || 500;
      sendError(req, res, e?.message || 'Internal server error', status, 'INTERNAL_ERROR');
      res.status(status).json({ error: e?.message || 'Internal server error' });
    });
}

export const markAttendance = wrapAsync(async (req, res) => {
  const { eventId, token, email } = req.body;
  if (!eventId && !token && !email) {
    return sendError(req, res, 'Provide eventId and either token or email', 400, 'VALIDATION_ERROR');
    return res.status(400).json({ error: 'Provide eventId and either token or email' });
    return sendError(
      req,
      res,
      'Provide eventId and either token or email',
      400,
      'VALIDATION_ERROR'
    );
  }

  let registration;
  if (token) {
    registration = await registrationsRepository.findByTicketToken(token);
  } else if (email && eventId) {
    registration = await registrationsRepository.findByEmailAndEvent(email, eventId);
  }

  if (!registration) {
    return sendError(req, res, 'Registration not found', 404, 'NOT_FOUND');
  }

  if (registration.attended) {
    return sendSuccess(res, { ...registration, already_attended: true });
  }

  if (registration.attended) {
    return res.status(200).json({ ...registration, already_attended: true });
  }

  const updated = await registrationsRepository.markAttendance(registration.id);
  if (!updated) {
    return sendError(req, res, 'Failed to mark attendance', 500, 'INTERNAL_ERROR');
    return res.status(500).json({ error: 'Failed to mark attendance' });
  }

  try {
    emitToRole('events_admin', 'admin:attendance-marked', {
      eventId: registration.event_id,
      userName: registration.full_name,
      email: registration.email,
      timestamp: new Date(),
    });
  } catch (e) {
    console.error('[Attendance] Failed to broadcast:', e);
  }

  return sendSuccess(res, { ...updated, already_attended: false });
});

export const getAttendanceList = wrapAsync(async (req, res) => {
  const eventId = String(req.params.eventId || req.query.eventId || '').trim();
  const exportFormat = String(req.query.export || '').trim();
  
  if (!eventId) {
    return sendError(req, res, 'Event ID required', 400, 'VALIDATION_ERROR');
  }
  
  const registrations = await registrationsRepository.findByEventId(eventId);
  
  if (exportFormat === 'csv') {
      const csvHeader = 'Name,Email,Attended,Registered At\n';
      const csvRows = registrations.map(r => 
          `"${r.full_name}","${r.email}",${r.attended},"${r.created_at}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_${eventId}.csv"`);
      return res.send(csvHeader + csvRows);
  }
  
  return sendSuccess(res, { registrations });
});

