import { Router } from 'express';
import { userGroupsRepository } from '../repositories/userGroupsRepository.js';
import { adminAuthMiddleware } from '../middleware/adminAuthMiddleware.js';
import { validate } from '../middleware/validate.js';
import { sendSuccess, sendError, sendNoContent } from '../utils/responseHelper.js';
import {
  groupIdParamsSchema,
  groupMemberParamsSchema,
  createGroupBodySchema,
  updateGroupBodySchema,
  addMembersBodySchema,
  emailGroupBodySchema,
} from '../validators/routes/userGroupsSchemas.js';

const router = Router();

router.use('/admin/groups', adminAuthMiddleware.requireAdmin);

// List all groups
router.get('/admin/groups', async (req, res) => {
  try {
    const groups = await userGroupsRepository.listGroups();
    sendSuccess(res, { groups });
  } catch (err) {
    console.error('Error fetching groups:', err);
    sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

// Create group
router.post('/admin/groups', validate(createGroupBodySchema), async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const group = await userGroupsRepository.createGroup({ name, description, permissions });
    sendSuccess(res, { group }, 201);
  } catch (err) {
    if (err.code === '23505') {
      return sendError(req, res, 'Group name already exists', 409, 'CONFLICT');
    }
    console.error('Error creating group:', err);
    sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

// Get single group
router.get('/admin/groups/:id', validate(groupIdParamsSchema, 'params'), async (req, res) => {
  try {
    const group = await userGroupsRepository.getGroupById(req.params.id);
    if (!group) return sendError(req, res, 'Group not found', 404, 'NOT_FOUND');
    sendSuccess(res, { group });
  } catch (err) {
    console.error('Error fetching group:', err);
    sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

// Update group
router.put(
  '/admin/groups/:id',
  validate(groupIdParamsSchema, 'params'),
  validate(updateGroupBodySchema),
  async (req, res) => {
    try {
      const group = await userGroupsRepository.updateGroup(req.params.id, req.body);
      if (!group) return sendError(req, res, 'Group not found', 404, 'NOT_FOUND');
      sendSuccess(res, { group });
    } catch (err) {
      console.error('Error updating group:', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

// Delete group
router.delete('/admin/groups/:id', validate(groupIdParamsSchema, 'params'), async (req, res) => {
  try {
    const success = await userGroupsRepository.deleteGroup(req.params.id);
    if (!success) return sendError(req, res, 'Group not found', 404, 'NOT_FOUND');
    sendSuccess(res, { success: true });
  } catch (err) {
    console.error('Error deleting group:', err);
    sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
  }
});

// Get group members
router.get(
  '/admin/groups/:id/members',
  validate(groupIdParamsSchema, 'params'),
  async (req, res) => {
    try {
      const members = await userGroupsRepository.getGroupMembers(req.params.id);
      sendSuccess(res, { members });
    } catch (err) {
      console.error('Error fetching group members:', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

// Add members to group
router.post(
  '/admin/groups/:id/members',
  validate(groupIdParamsSchema, 'params'),
  validate(addMembersBodySchema),
  async (req, res) => {
    try {
      const { studentIds } = req.body;
      const addedCount = await userGroupsRepository.addMembersToGroup(req.params.id, studentIds);
      sendSuccess(res, { addedCount });
    } catch (err) {
      console.error('Error adding members:', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

// Remove member from group
router.delete(
  '/admin/groups/:id/members/:studentId',
  validate(groupMemberParamsSchema, 'params'),
  async (req, res) => {
    try {
      const success = await userGroupsRepository.removeMemberFromGroup(
        req.params.id,
        req.params.studentId
      );
      if (!success) return sendError(req, res, 'Member not found in group', 404, 'NOT_FOUND');
      sendSuccess(res, { success: true });
    } catch (err) {
      console.error('Error removing member:', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);

// Bulk email group
router.post(
  '/admin/groups/:id/email',
  validate(groupIdParamsSchema, 'params'),
  validate(emailGroupBodySchema),
  async (req, res) => {
    try {
      const { subject, htmlContent } = req.body;

      // Import inside route to avoid circular deps if any
      const { emailCampaignRepository } =
        await import('../repositories/emailCampaignRepository.js');
      const { emailCampaignService } = await import('../services/emailCampaignService.js');

      // Create a one-off campaign for this group
      const campaign = await emailCampaignRepository.createCampaign({
        name: `Group Email - ${req.params.id} - ${new Date().toISOString()}`,
        subject,
        content: { html: htmlContent },
        segmentCriteria: { groupId: req.params.id },
        status: 'draft',
        createdBy: req.user?.username || 'admin',
      });

      // Send it immediately
      const stats = await emailCampaignService.sendCampaign(campaign.id);
      sendSuccess(res, { success: true, campaignId: campaign.id, stats });
    } catch (err) {
      console.error('Error sending bulk email:', err);
      sendError(req, res, 'Internal server error', 500, 'INTERNAL_ERROR');
    }
  }
);


export default router;
