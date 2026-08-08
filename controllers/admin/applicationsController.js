const TeamApplication = require('../../models/TeamApplication');
const User = require('../../models/User');
const { sendApprovalEmail, sendRejectionEmail } = require('../../services/emailService');

exports.getPending = async (req, res) => {
  try {
    const applications = await TeamApplication.find({ status: 'pending' })
      .populate('userId', 'name email username')
      .sort({ appliedAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const { feedback } = req.body;
    const application = await TeamApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (application.status !== 'pending') {
      return res.status(400).json({ error: 'Application already processed' });
    }

    application.status = 'approved';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    application.feedback = feedback || '';
    await application.save();

    await User.findByIdAndUpdate(application.userId, {
      isTeamMember: true,
      teamRole: application.role,
    });

    await sendApprovalEmail(application.userId, application.role, feedback);
    res.json({ message: 'Application approved', application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reject = async (req, res) => {
  try {
    const { feedback } = req.body;
    if (!feedback) {
      return res.status(400).json({ error: 'Feedback is required for rejection' });
    }

    const application = await TeamApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.status = 'rejected';
    application.reviewedAt = new Date();
    application.reviewedBy = req.user.id;
    application.feedback = feedback;
    await application.save();

    await sendRejectionEmail(application.userId, feedback);
    res.json({ message: 'Application rejected', application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTimeline = async (req, res) => {
  try {
    const { startDate, endDate, role } = req.query;

    // --- Add this validation ---
    if (startDate && isNaN(new Date(startDate))) {
      return res.status(400).json({ error: 'Invalid startDate format' });
    }
    if (endDate && isNaN(new Date(endDate))) {
      return res.status(400).json({ error: 'Invalid endDate format' });
    }
    // --------------------------
    const filter = { status: 'approved' };
    if (startDate) filter.reviewedAt = { $gte: new Date(startDate) };
    if (endDate) filter.reviewedAt = { ...filter.reviewedAt, $lte: new Date(endDate) };
    if (role) filter.role = role;

    const timeline = await TeamApplication.find(filter)
      .populate('userId', 'name email')
      .populate('reviewedBy', 'name')
      .sort({ reviewedAt: -1 });
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
