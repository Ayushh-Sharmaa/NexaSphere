import { supabaseAdmin, dbPool } from "../config/supabase.js";
import logger from "../utils/logger.js";

const VALID_TRANSITIONS = {
  pending: ["under_review", "withdrawn"],
  under_review: ["accepted", "rejected", "on_hold"],
  on_hold: ["under_review", "accepted", "rejected"],
  accepted: ["withdrawn"],
  rejected: ["withdrawn"],
  withdrawn: [],
};

export const applicationsService = {
  async generateApplicationNumber(type) {
    const prefix = type === "core_team" ? "NX-CORE" : "NX-MEM";
    const year = new Date().getFullYear();

    if (dbPool) {
      const res = await dbPool.query(
        `SELECT COUNT(*) as count FROM applications WHERE application_type = $1`,
        [type]
      );
      const nextNum = parseInt(res.rows[0]?.count || 0, 10) + 1;
      const padded = String(nextNum).padStart(6, "0");
      return `${prefix}-${year}-${padded}`;
    }

    const { count } = await supabaseAdmin
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("application_type", type);

    const nextNum = (count || 0) + 1;
    const padded = String(nextNum).padStart(6, "0");
    return `${prefix}-${year}-${padded}`;
  },

  async getApplicationsByClerkId(clerkUserId) {
    if (dbPool) {
      const res = await dbPool.query(
        `SELECT * FROM applications WHERE clerk_user_id = $1 ORDER BY created_at DESC`,
        [clerkUserId]
      );
      return res.rows;
    }

    const { data, error } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getApplicationStatusSummary(clerkUserId) {
    const apps = await this.getApplicationsByClerkId(clerkUserId);
    const membershipApp = apps.find((a) => a.application_type === "membership");
    const coreTeamApp = apps.find((a) => a.application_type === "core_team");

    let onboardingStatus = "profile_incomplete";
    if (membershipApp) {
      if (membershipApp.status === "accepted") {
        onboardingStatus = coreTeamApp
          ? coreTeamApp.status === "accepted"
            ? "core_member"
            : "core_team_applicant"
          : "member";
      } else if (
        membershipApp.status === "pending" ||
        membershipApp.status === "under_review"
      ) {
        onboardingStatus = "membership_pending";
      }
    }

    return {
      onboardingStatus,
      membership: membershipApp || null,
      coreTeam: coreTeamApp || null,
      isMember: membershipApp?.status === "accepted",
      canApplyCoreTeam:
        membershipApp?.status === "accepted" &&
        (!coreTeamApp ||
          coreTeamApp.status === "withdrawn" ||
          coreTeamApp.status === "rejected"),
    };
  },

  async submitApplication(
    clerkUserId,
    { applicationType, payload, schemaVersion = 1 }
  ) {
    if (!clerkUserId) throw new Error("clerkUserId is required");
    if (!["membership", "core_team"].includes(applicationType)) {
      throw new Error(
        "Invalid application type. Must be 'membership' or 'core_team'."
      );
    }

    // 1. If applying for core_team, verify approved membership prerequisite
    if (applicationType === "core_team") {
      const summary = await this.getApplicationStatusSummary(clerkUserId);
      if (!summary.isMember) {
        const error = new Error(
          "Core Team recruitment requires an active, approved NexaSphere membership."
        );
        error.code = "MEMBERSHIP_REQUIRED";
        error.statusCode = 403;
        throw error;
      }
    }

    // 2. Check for active application of the same type
    const existing = await this.getApplicationsByClerkId(clerkUserId);
    const activeApp = existing.find(
      (a) =>
        a.application_type === applicationType &&
        !["withdrawn", "rejected"].includes(a.status)
    );

    if (activeApp) {
      const error = new Error(
        `You already have an active ${applicationType} application (${activeApp.application_number}) in status '${activeApp.status}'.`
      );
      error.code = "DUPLICATE_APPLICATION";
      error.statusCode = 409;
      error.application = activeApp;
      throw error;
    }

    const applicationNumber =
      await this.generateApplicationNumber(applicationType);

    if (dbPool) {
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");
        const insertRes = await client.query(
          `INSERT INTO applications (application_number, clerk_user_id, application_type, status, schema_version, payload)
           VALUES ($1, $2, $3, 'pending', $4, $5)
           RETURNING *`,
          [
            applicationNumber,
            clerkUserId,
            applicationType,
            schemaVersion,
            JSON.stringify(payload || {}),
          ]
        );

        const newApp = insertRes.rows[0];

        // Record initial status history
        await client.query(
          `INSERT INTO application_status_history (application_id, old_status, new_status, status_changed_by, notes)
           VALUES ($1, NULL, 'pending', $2, 'Initial application submission.')`,
          [newApp.id, clerkUserId]
        );

        // Record notification
        await client.query(
          `INSERT INTO notifications (clerk_user_id, type, title, message, data)
           VALUES ($1, 'application_submitted', $2, $3, $4)`,
          [
            clerkUserId,
            `${applicationType === "membership" ? "Membership" : "Core Team"} Application Received`,
            `Your application ${applicationNumber} has been received and is currently Pending review.`,
            JSON.stringify({ applicationId: newApp.id, applicationNumber }),
          ]
        );

        await client.query("COMMIT");
        return newApp;
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    // Supabase fallback
    const { data: newApp, error } = await supabaseAdmin
      .from("applications")
      .insert({
        application_number: applicationNumber,
        clerk_user_id: clerkUserId,
        application_type: applicationType,
        status: "pending",
        schema_version: schemaVersion,
        payload: payload || {},
      })
      .select("*")
      .single();

    if (error) throw error;

    await supabaseAdmin.from("application_status_history").insert({
      application_id: newApp.id,
      new_status: "pending",
      status_changed_by: clerkUserId,
      notes: "Initial application submission.",
    });

    await supabaseAdmin.from("notifications").insert({
      clerk_user_id: clerkUserId,
      type: "application_submitted",
      title: `${applicationType === "membership" ? "Membership" : "Core Team"} Application Received`,
      message: `Your application ${applicationNumber} has been received and is currently Pending review.`,
      data: { applicationId: newApp.id, applicationNumber },
    });

    return newApp;
  },

  async getApplicationDetails(applicationId) {
    if (dbPool) {
      const appRes = await dbPool.query(
        `SELECT a.*, p.full_name, p.email, p.phone, p.roll_number, p.branch, p.year, p.section, p.avatar_url, p.github_url, p.linkedin_url, p.portfolio_url
         FROM applications a
         JOIN profiles p ON a.clerk_user_id = p.clerk_user_id
         WHERE a.id = $1`,
        [applicationId]
      );
      if (!appRes.rows.length) return null;

      const historyRes = await dbPool.query(
        `SELECT * FROM application_status_history WHERE application_id = $1 ORDER BY status_changed_at ASC`,
        [applicationId]
      );

      return {
        ...appRes.rows[0],
        history: historyRes.rows,
      };
    }

    const { data: app, error } = await supabaseAdmin
      .from("applications")
      .select("*, profiles(*)")
      .eq("id", applicationId)
      .maybeSingle();

    if (error || !app) return null;

    const { data: history } = await supabaseAdmin
      .from("application_status_history")
      .select("*")
      .eq("application_id", applicationId)
      .order("status_changed_at", { ascending: true });

    return {
      ...app,
      history: history || [],
    };
  },

  async updateApplicationStatus(
    applicationId,
    { status: newStatus, notes, reason, adminUserId }
  ) {
    const current = await this.getApplicationDetails(applicationId);
    if (!current) {
      const error = new Error("Application not found.");
      error.statusCode = 404;
      throw error;
    }

    const allowedNext = VALID_TRANSITIONS[current.status] || [];
    if (!allowedNext.includes(newStatus)) {
      const error = new Error(
        `Invalid status transition from '${current.status}' to '${newStatus}'. Allowed: ${allowedNext.join(", ") || "none"}`
      );
      error.statusCode = 400;
      throw error;
    }

    const updateFields = {
      status: newStatus,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    };
    if (notes) updateFields.reviewer_notes = notes;
    if (newStatus === "rejected" && reason)
      updateFields.rejection_reason = reason;
    if (newStatus === "on_hold" && reason) updateFields.hold_reason = reason;

    if (dbPool) {
      const client = await dbPool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE applications
           SET status = $1, reviewed_by = $2, reviewed_at = NOW(),
               reviewer_notes = COALESCE($3, reviewer_notes),
               rejection_reason = $4, hold_reason = $5, updated_at = NOW()
           WHERE id = $6`,
          [
            newStatus,
            adminUserId,
            notes || null,
            newStatus === "rejected" ? reason || null : null,
            newStatus === "on_hold" ? reason || null : null,
            applicationId,
          ]
        );

        // Record history
        await client.query(
          `INSERT INTO application_status_history (application_id, old_status, new_status, status_changed_by, change_reason, notes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            applicationId,
            current.status,
            newStatus,
            adminUserId,
            reason || null,
            notes || null,
          ]
        );

        // Record student notification
        const statusLabel = newStatus.replace("_", " ").toUpperCase();
        await client.query(
          `INSERT INTO notifications (clerk_user_id, type, title, message, data)
           VALUES ($1, 'application_status_update', $2, $3, $4)`,
          [
            current.clerk_user_id,
            `Application Status: ${statusLabel}`,
            `Your ${current.application_type} application (${current.application_number}) status has been updated to ${statusLabel}.${reason ? ` Note: ${reason}` : ""}`,
            JSON.stringify({
              applicationId,
              applicationNumber: current.application_number,
              newStatus,
            }),
          ]
        );

        // Audit log
        await client.query(
          `INSERT INTO audit_logs (actor_user_id, action, resource_type, resource_id, old_data, new_data)
           VALUES ($1, 'application.status_update', 'application', $2, $3, $4)`,
          [
            adminUserId,
            applicationId,
            JSON.stringify({ status: current.status }),
            JSON.stringify({ status: newStatus, reason, notes }),
          ]
        );

        await client.query("COMMIT");
        return this.getApplicationDetails(applicationId);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    // Supabase fallback
    await supabaseAdmin
      .from("applications")
      .update(updateFields)
      .eq("id", applicationId);
    await supabaseAdmin.from("application_status_history").insert({
      application_id: applicationId,
      old_status: current.status,
      new_status: newStatus,
      status_changed_by: adminUserId,
      change_reason: reason || null,
      notes: notes || null,
    });
    await supabaseAdmin.from("notifications").insert({
      clerk_user_id: current.clerk_user_id,
      type: "application_status_update",
      title: `Application Status: ${newStatus.replace("_", " ").toUpperCase()}`,
      message: `Your ${current.application_type} application (${current.application_number}) status has been updated to ${newStatus}.`,
      data: {
        applicationId,
        applicationNumber: current.application_number,
        newStatus,
      },
    });

    return this.getApplicationDetails(applicationId);
  },

  async listAdminApplications({
    type,
    status,
    branch,
    year,
    search,
    page = 1,
    limit = 20,
  }) {
    const offset = (page - 1) * limit;

    if (dbPool) {
      const conditions = [];
      const params = [];

      if (type) {
        params.push(type);
        conditions.push(`a.application_type = $${params.length}`);
      }
      if (status) {
        params.push(status);
        conditions.push(`a.status = $${params.length}`);
      }
      if (branch) {
        params.push(branch);
        conditions.push(`p.branch = $${params.length}`);
      }
      if (year) {
        params.push(year);
        conditions.push(`p.year = $${params.length}`);
      }
      if (search) {
        params.push(`%${search}%`);
        conditions.push(
          `(p.full_name ILIKE $${params.length} OR p.email ILIKE $${params.length} OR a.application_number ILIKE $${params.length} OR p.roll_number ILIKE $${params.length})`
        );
      }

      const whereClause = conditions.length
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

      const countRes = await dbPool.query(
        `SELECT COUNT(*) as total
         FROM applications a
         JOIN profiles p ON a.clerk_user_id = p.clerk_user_id
         ${whereClause}`,
        params
      );
      const total = parseInt(countRes.rows[0]?.total || 0, 10);

      params.push(limit, offset);
      const dataRes = await dbPool.query(
        `SELECT a.*, p.full_name, p.email, p.roll_number, p.branch, p.year, p.section, p.avatar_url
         FROM applications a
         JOIN profiles p ON a.clerk_user_id = p.clerk_user_id
         ${whereClause}
         ORDER BY a.submitted_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      );

      return {
        applications: dataRes.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    return {
      applications: [],
      pagination: { page, limit, total: 0, totalPages: 1 },
    };
  },
};
