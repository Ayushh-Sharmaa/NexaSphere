const express = require('express');
const router = express.Router();
const eventStore = require('../eventStore/eventStore');
const { DocumentProjection } = require('../eventStore/projections');

// Get raw audit log (event stream) for an entity
router.get('/log/:aggregateId', (req, res) => {
  const events = eventStore.getEventsForAggregate(req.params.aggregateId);
  res.json({ success: true, count: events.length, events });
});

// Get the projected current state of a document
router.get('/document/:aggregateId/state', (req, res) => {
  const events = eventStore.getEventsForAggregate(req.params.aggregateId);
  
  if (events.length === 0) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const currentState = DocumentProjection.project(events);
  
  if (!currentState) {
    return res.status(410).json({ success: false, message: 'Document was deleted' });
  }

  res.json({ success: true, state: currentState });
});

// Demo endpoint to create some events
router.post('/demo-simulate', (req, res) => {
  const { DOCUMENT_CREATED, DOCUMENT_TITLE_UPDATED } = require('../eventStore/events');
  const aggregateId = `doc-${Date.now()}`;
  
  eventStore.append(aggregateId, DOCUMENT_CREATED, { title: 'Initial Draft', author: 'User1' });
  eventStore.append(aggregateId, DOCUMENT_TITLE_UPDATED, { newTitle: 'Final Review Draft' });
  
  res.json({ success: true, message: 'Simulated events appended', aggregateId });
});

module.exports = router;
