import { smartFormsRepository } from '../repositories/smartFormsRepository.js';

export const createForm = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, type, schema } = req.body;

    if (!title || !type || !schema) {
      return res.status(400).json({ error: 'title, type, and schema are required' });
    }

    const form = await smartFormsRepository.createForm(eventId, title, type, schema);

    if (req.adminSession) {
      req.auditLog = {
        action: 'smart_forms.create',
        targetId: form.id,
        targetType: 'SmartForm',
        details: { eventId, title, type },
      };
    }

    return res.status(201).json(form);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getForms = async (req, res) => {
  try {
    const { eventId } = req.params;
    const forms = await smartFormsRepository.getFormsByEvent(eventId);
    return res.json(forms);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getFormById = async (req, res) => {
  try {
    const { formId } = req.params;
    const form = await smartFormsRepository.getFormById(formId);
    if (!form) return res.status(404).json({ error: 'Form not found' });
    return res.json(form);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const patch = req.body;

    const form = await smartFormsRepository.updateForm(formId, patch);

    if (req.adminSession) {
      req.auditLog = {
        action: 'smart_forms.update',
        targetId: form.id,
        targetType: 'SmartForm',
        details: { patch },
      };
    }

    return res.json(form);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const { formId } = req.params;
    await smartFormsRepository.deleteForm(formId);

    if (req.adminSession) {
      req.auditLog = {
        action: 'smart_forms.delete',
        targetId: formId,
        targetType: 'SmartForm',
        details: {},
      };
    }

    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const submitResponse = async (req, res) => {
  try {
    const { formId } = req.params;
    const { answers } = req.body;
    const userId = req.user?.id || null; // Can be public or authenticated

    const response = await smartFormsRepository.submitResponse(formId, userId, answers);
    return res.status(201).json({ message: 'Form submitted successfully', response });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getResponses = async (req, res) => {
  try {
    const { formId } = req.params;
    const { status } = req.query;
    const responses = await smartFormsRepository.getResponses(formId, { status });
    return res.json(responses);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const updateResponseStatus = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    const response = await smartFormsRepository.updateResponseStatus(responseId, status);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const { formId } = req.params;
    const analytics = await smartFormsRepository.getAnalytics(formId);
    if (!analytics) return res.status(404).json({ error: 'Analytics not available' });
    return res.json(analytics);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
