import { eventSurveyRepository } from '../repositories/eventSurveyRepository.js';

export const getTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const template = await eventSurveyRepository.getTemplate(eventId);
    if (!template) {
      return res.status(404).json({ error: 'Survey template not found' });
    }
    return res.json(template);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const setTemplate = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'questions must be an array' });
    }

    const template = await eventSurveyRepository.upsertTemplate(eventId, questions);

    if (req.adminSession) {
      req.auditLog = {
        action: 'event_survey.set_template',
        targetId: eventId,
        targetType: 'EventSurvey',
        details: { questions },
      };
    }

    return res.json(template);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const submitResponse = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id; // Assuming authMiddleware injects user

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const response = await eventSurveyRepository.submitResponse(eventId, userId, answers);
    return res.json({ message: 'Survey submitted successfully', response });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;
    const analytics = await eventSurveyRepository.getAnalytics(eventId);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not available' });
    }

    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
