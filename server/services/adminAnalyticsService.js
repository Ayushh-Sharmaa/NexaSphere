import { dbPool } from "../config/supabase.js";

export const adminAnalyticsService = {
  async getMetrics() {
    if (dbPool) {
      const [
        studentsRes,
        pendingMemRes,
        underReviewMemRes,
        acceptedMemRes,
        coreTeamAppsRes,
        pendingCoreTeamRes,
        upcomingEventsRes,
        activitiesCountRes,
        registrationsCountRes,
      ] = await Promise.all([
        dbPool.query(`SELECT COUNT(*) as count FROM profiles`),
        dbPool.query(
          `SELECT COUNT(*) as count FROM applications WHERE application_type = 'membership' AND status = 'pending'`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM applications WHERE application_type = 'membership' AND status = 'under_review'`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM applications WHERE application_type = 'membership' AND status = 'accepted'`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM applications WHERE application_type = 'core_team'`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM applications WHERE application_type = 'core_team' AND status IN ('pending', 'under_review')`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM events WHERE status = 'upcoming'`
        ),
        dbPool.query(
          `SELECT COUNT(*) as count FROM activities WHERE status = 'published'`
        ),
        dbPool.query(`SELECT COUNT(*) as count FROM event_registrations`),
      ]);

      return {
        totalStudents: parseInt(studentsRes.rows[0]?.count || 0, 10),
        pendingMemberships: parseInt(pendingMemRes.rows[0]?.count || 0, 10),
        underReviewMemberships: parseInt(
          underReviewMemRes.rows[0]?.count || 0,
          10
        ),
        acceptedMembers: parseInt(acceptedMemRes.rows[0]?.count || 0, 10),
        coreTeamApplications: parseInt(coreTeamAppsRes.rows[0]?.count || 0, 10),
        pendingCoreTeamReviews: parseInt(
          pendingCoreTeamRes.rows[0]?.count || 0,
          10
        ),
        upcomingEvents: parseInt(upcomingEventsRes.rows[0]?.count || 0, 10),
        totalActivities: parseInt(activitiesCountRes.rows[0]?.count || 0, 10),
        totalEventRegistrations: parseInt(
          registrationsCountRes.rows[0]?.count || 0,
          10
        ),
      };
    }

    return {
      totalStudents: 0,
      pendingMemberships: 0,
      underReviewMemberships: 0,
      acceptedMembers: 0,
      coreTeamApplications: 0,
      pendingCoreTeamReviews: 0,
      upcomingEvents: 0,
      totalActivities: 0,
      totalEventRegistrations: 0,
    };
  },
};
