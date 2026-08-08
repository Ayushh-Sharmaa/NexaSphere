import { withDb } from './db.js';

export const eventSurveyRepository = {
  async getTemplate(eventId) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `select * from event_survey_templates where event_id = $1 limit 1`,
        [eventId]
      );
      return rows[0] || null;
    });
  },

  async upsertTemplate(eventId, questions) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into event_survey_templates (event_id, questions, updated_at)
         values ($1, $2, current_timestamp)
         on conflict (event_id) do update set 
           questions = excluded.questions,
           updated_at = current_timestamp
         returning *`,
        [eventId, JSON.stringify(questions)]
      );
      return rows[0];
    });
  },

  async submitResponse(eventId, userId, answers) {
    return withDb(async (client) => {
      const { rows } = await client.query(
        `insert into event_survey_responses (event_id, user_id, answers)
         values ($1, $2, $3)
         on conflict (event_id, user_id) do update set
           answers = excluded.answers,
           submitted_at = current_timestamp
         returning *`,
        [eventId, userId, JSON.stringify(answers)]
      );
      return rows[0];
    });
  },

  async getAnalytics(eventId) {
    return withDb(async (client) => {
      const { rows: responses } = await client.query(
        `select answers from event_survey_responses where event_id = $1`,
        [eventId]
      );

      const { rows: templateRows } = await client.query(
        `select questions from event_survey_templates where event_id = $1`,
        [eventId]
      );

      if (!templateRows.length) return null;

      const questions = templateRows[0].questions;
      const totalResponses = responses.length;

      return { totalResponses, questions, responses: responses.map((r) => r.answers) };
    });
  },
};
