const EventTypes = require('./events');

/**
 * Projections are responsible for reading a stream of events 
 * and building a "Read Model" (the current state).
 * This implements the Query side of CQRS.
 */
class DocumentProjection {
  
  /**
   * Reconstruct the current state of a document by playing its events
   * forward from the beginning of time.
   */
  static project(events) {
    let documentState = null;

    for (const event of events) {
      switch (event.eventType) {
        case EventTypes.DOCUMENT_CREATED:
          documentState = {
            id: event.aggregateId,
            ...event.payload,
            version: 1
          };
          break;
        case EventTypes.DOCUMENT_TITLE_UPDATED:
          if (documentState) {
            documentState.title = event.payload.newTitle;
            documentState.version += 1;
          }
          break;
        case EventTypes.DOCUMENT_DELETED:
          documentState = null;
          break;
      }
    }

    return documentState;
  }
}

module.exports = { DocumentProjection };
