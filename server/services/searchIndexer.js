import { typesenseClient, isTypesenseEnabled, COLLECTIONS } from '../config/typesense.js';
import logger from '../utils/logger.js';

export const searchIndexer = {
  /**
   * Index or update an event in Typesense
   */
  async indexEvent(event) {
    if (!isTypesenseEnabled) return;
    try {
      const doc = {
        id: event.id,
        name: event.name || '',
        description: event.description || '',
        shortName: event.shortName || '',
        location: event.location || '',
        tags: Array.isArray(event.tags) ? event.tags : [],
        category: event.category || '',
        date: event.date || '',
      };
      await typesenseClient.collections(COLLECTIONS.EVENTS.name).documents().upsert(doc);
    } catch (err) {
      logger.error('Failed to index event in Typesense', { id: event.id, error: err.message });
    }
  },

  /**
   * Index or update a core team member in Typesense
   */
  async indexMember(member) {
    if (!isTypesenseEnabled) return;
    try {
      const doc = {
        id: member.id,
        name: member.name || '',
        role: member.role || '',
        bio: member.bio || '',
        skills: Array.isArray(member.skills) ? member.skills : [],
      };
      await typesenseClient.collections(COLLECTIONS.MEMBERS.name).documents().upsert(doc);
    } catch (err) {
      logger.error('Failed to index member in Typesense', { id: member.id, error: err.message });
    }
  },

  /**
   * Index or update an activity in Typesense
   */
  async indexActivity(key, activity) {
    if (!isTypesenseEnabled) return;
    try {
      const doc = {
        id: key,
        title: activity.title || '',
        description: activity.description || '',
        subtitle: activity.subtitle || '',
        tags: Array.isArray(activity.tags) ? activity.tags : [],
      };
      await typesenseClient.collections(COLLECTIONS.ACTIVITIES.name).documents().upsert(doc);
    } catch (err) {
      logger.error('Failed to index activity in Typesense', { key, error: err.message });
    }
  },

  /**
   * Delete a document from a collection
   */
  async deleteDocument(collectionName, id) {
    if (!isTypesenseEnabled) return;
    try {
      await typesenseClient.collections(collectionName).documents(id).delete();
    } catch (err) {
      // If it doesn't exist, it's fine
      if (err.status !== 404) {
        logger.error(`Failed to delete document from ${collectionName}`, {
          id,
          error: err.message,
        });
      }
    }
  },
};
