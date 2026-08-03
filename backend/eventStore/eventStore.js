const { v4: uuidv4 } = require('uuid');

/**
 * Append-only Event Store ledger.
 * In a real-world scenario, this would persist to EventStoreDB, Apache Kafka,
 * or an append-only PostgreSQL table.
 */
class EventStore {
  constructor() {
    this.events = [];
  }

  /**
   * Append a new event to the ledger
   * @param {string} aggregateId - The ID of the entity (e.g. documentId)
   * @param {string} eventType - From events.js
   * @param {Object} payload - The data associated with the event
   */
  append(aggregateId, eventType, payload, metadata = {}) {
    const event = {
      id: uuidv4(),
      aggregateId,
      eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      }
    };
    
    this.events.push(event);
    console.log(`[EventStore] Appended ${eventType} for ${aggregateId}`);
    return event;
  }

  /**
   * Retrieve all events for a specific entity to reconstruct its state
   */
  getEventsForAggregate(aggregateId) {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }

  /**
   * Retrieve the entire ledger (useful for full system replay/audit)
   */
  getAllEvents() {
    return this.events;
  }
}

module.exports = new EventStore();
