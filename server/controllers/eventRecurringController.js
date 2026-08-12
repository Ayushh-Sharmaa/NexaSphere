import { v4 as uuidv4 } from 'uuid';
import { RRule } from 'rrule';
import { eventsRepository } from '../repositories/eventsRepository.js';
import { adminAuditMiddleware } from '../middleware/adminAuditMiddleware.js';

export const createSeries = async (req, res) => {
  try {
    const { eventTemplate, rruleString } = req.body;

    if (!eventTemplate || !eventTemplate.name || !eventTemplate.date) {
      return res.status(400).json({ error: 'Missing required event template fields.' });
    }

    if (!rruleString) {
      return res.status(400).json({ error: 'rruleString is required to generate a series.' });
    }

    // Parse RRule
    const rule = RRule.fromString(rruleString);
    const startDate = new Date(eventTemplate.date);

    // Rrule requires dtstart to be passed inside options if not in string,
    // but typically it's safer to just set it via options.
    const ruleOptions = RRule.parseString(rruleString);
    ruleOptions.dtstart = startDate;
    const finalRule = new RRule(ruleOptions);

    const occurrences = finalRule.all();

    if (occurrences.length === 0) {
      return res.status(400).json({ error: 'RRULE generated 0 occurrences.' });
    }

    if (occurrences.length > 100) {
      return res.status(400).json({ error: 'Series exceeds maximum limit of 100 occurrences.' });
    }

    const seriesId = uuidv4();
    const createdEvents = [];

    // Create each occurrence
    for (let i = 0; i < occurrences.length; i++) {
      const occurrenceDate = occurrences[i];
      const eventId = `${eventTemplate.shortName || 'event'}-${seriesId.split('-')[0]}-${i + 1}`;

      const newEvent = {
        ...eventTemplate,
        id: eventId,
        date: occurrenceDate.toISOString(),
        seriesId: seriesId,
        recurrencePattern: rruleString,
        recurrenceEndDate: occurrences[occurrences.length - 1].toISOString(),
        occurrenceIndex: i + 1,
      };

      const created = await eventsRepository.create(newEvent);
      createdEvents.push(created);
    }

    // Optional: Log admin action
    if (req.adminSession) {
      req.auditLog = {
        action: 'event_series.create',
        targetId: seriesId,
        targetType: 'EventSeries',
        details: {
          count: createdEvents.length,
          rrule: rruleString,
        },
      };
    }

    return res.status(201).json({
      message: 'Series created successfully',
      seriesId,
      count: createdEvents.length,
      events: createdEvents,
    });
  } catch (error) {
    console.error('Error creating event series:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const updateSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;
    const patch = req.body;

    if (!seriesId) {
      return res.status(400).json({ error: 'seriesId is required' });
    }

    const updatedCount = await eventsRepository.updateSeries(seriesId, patch);

    if (req.adminSession) {
      req.auditLog = {
        action: 'event_series.update',
        targetId: seriesId,
        targetType: 'EventSeries',
        details: { patch },
      };
    }

    return res.status(200).json({ message: 'Series updated', updatedCount });
  } catch (error) {
    console.error('Error updating event series:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const deleteSeries = async (req, res) => {
  try {
    const { seriesId } = req.params;

    if (!seriesId) {
      return res.status(400).json({ error: 'seriesId is required' });
    }

    await eventsRepository.deleteSeries(seriesId);

    if (req.adminSession) {
      req.auditLog = {
        action: 'event_series.delete',
        targetId: seriesId,
        targetType: 'EventSeries',
        details: {},
      };
    }

    return res.status(200).json({ message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting event series:', error);
    return res.status(500).json({ error: error.message });
  }
};
