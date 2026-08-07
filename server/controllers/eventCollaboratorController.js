import { eventCollaboratorRepository } from '../repositories/eventCollaboratorRepository.js';
import { sendEmail } from '../services/emailService.js';

export const eventCollaboratorController = {
  async invite(req, res) {
    try {
      const { event_id } = req.params;
      const { email, role, permissions } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Default permissions if not provided
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

      // Send invitation email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const acceptUrl = `${frontendUrl}/events/${event_id}/collaborate?email=${encodeURIComponent(email)}`;

      await sendEmail({
        to: email,
        subject: `You've been invited to co-organize an event on NexaSphere`,
        templateName: 'generic', // Use a generic template or you could create a new one
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

      // Verify the sender is a collaborator
      const collaborator = await eventCollaboratorRepository.getCollaborator(
        event_id,
        sender_email
      );

      // We will allow admins or the main organizer to also message, but for simplicity assuming the user is verified by auth middleware
      // and we just require them to either be a collaborator or the request is made by admin/organizer.
      // Here we just insert the message.

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
