import { eventCollaboratorRepository } from '../repositories/eventCollaboratorRepository.js';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { sendEmail } from '../services/emailService.js';

async function isAuthorizedToManageCollaborators(event_id, req) {
  const event = await eventsRepository.getById(event_id);
  if (!event) return { authorized: false, status: 404, error: 'Event not found' };
  
  const userId = req.studentUser?.sub || req.user?.id;
  const isAdmin = req.studentUser?.role === 'admin' || req.user?.isAdmin;
  const isOrganizer = event.organizer_id === userId || event.organizer_id === req.studentUser?.email;
  
  if (!isOrganizer && !isAdmin) {
    return { authorized: false, status: 403, error: 'Only the event organizer or an admin can manage collaborators' };
  }
  
  return { authorized: true, event };
}

export const eventCollaboratorController = {
  async invite(req, res) {
    try {
      const { event_id } = req.params;
      const { email, role, permissions } = req.body;

      const authCheck = await isAuthorizedToManageCollaborators(event_id, req);
      if (!authCheck.authorized) {
        return res.status(authCheck.status).json({ error: authCheck.error });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const finalPermissions = permissions || {
        can_edit: true,
        can_delete: false,
        can_view_attendance: true,
        can_message: true,
      };

      const collaborator = await eventCollaboratorRepository.inviteCollaborator({
        event_id,
        email,
        role,
        permissions: JSON.stringify(finalPermissions),
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const acceptUrl = `${frontendUrl}/events/${event_id}/collaborate?email=${encodeURIComponent(email)}`;

      await sendEmail({
        to: email,
        subject: `You've been invited to co-organize an event on NexaSphere`,
        templateName: 'generic',
        data: {
          title: 'Event Collaboration Invitation',
          body: `You have been invited as a ${role || 'co-organizer'}. Click below to accept your invitation.`,
          actionText: 'Accept Invitation',
          actionUrl: acceptUrl,
        },
      });

      return res.status(201).json({ collaborator });
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async list(req, res) {
    try {
      const { event_id } = req.params;
      const collaborators = await eventCollaboratorRepository.getCollaboratorsForEvent(event_id);
      return res.json({ collaborators });
    } catch (error) {
      console.error('Error listing collaborators:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async accept(req, res) {
    try {
      const { event_id } = req.params;
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const collaborator = await eventCollaboratorRepository.acceptInvitation(event_id, email);
      if (!collaborator) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      return res.json({ success: true, collaborator });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async remove(req, res) {
    try {
      const { event_id } = req.params;
      const { email } = req.body;

      const authCheck = await isAuthorizedToManageCollaborators(event_id, req);
      if (!authCheck.authorized) {
        return res.status(authCheck.status).json({ error: authCheck.error });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const deleted = await eventCollaboratorRepository.removeCollaborator(event_id, email);
      if (!deleted) {
        return res.status(404).json({ error: 'Collaborator not found' });
      }

      return res.json({ success: true });
    } catch (error) {
      console.error('Error removing collaborator:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async addMessage(req, res) {
    try {
      const { event_id } = req.params;
      const { sender_email, message } = req.body;

      if (!sender_email || !message) {
        return res.status(400).json({ error: 'Sender email and message are required' });
      }

      const userId = req.studentUser?.sub || req.user?.id;
      const userEmail = req.studentUser?.email || req.user?.email;
      const isAdmin = req.studentUser?.role === 'admin' || req.user?.isAdmin;

      const event = await eventsRepository.getById(event_id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const isOrganizer = event.organizer_id === userId || event.organizer_id === userEmail;

      if (!isOrganizer && !isAdmin) {
        const collaborator = await eventCollaboratorRepository.getCollaborator(
          event_id,
          sender_email
        );
        if (!collaborator) {
          return res.status(403).json({ error: 'Only collaborators, the event organizer, or admins can send messages' });
        }
        if (collaborator.email !== userEmail && collaborator.email !== sender_email) {
          return res.status(403).json({ error: 'You can only send messages as yourself' });
        }
      }

      const newMessage = await eventCollaboratorRepository.addMessage(
        event_id,
        sender_email,
        message
      );
      return res.status(201).json({ message: newMessage });
    } catch (error) {
      console.error('Error adding message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getMessages(req, res) {
    try {
      const { event_id } = req.params;
      const messages = await eventCollaboratorRepository.getMessages(event_id);
      return res.json({ messages });
    } catch (error) {
      console.error('Error getting messages:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};
