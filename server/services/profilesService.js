import { supabaseAdmin, dbPool } from "../config/supabase.js";
import logger from "../utils/logger.js";

export const profilesService = {
  async getProfileByClerkId(clerkUserId) {
    if (!clerkUserId) return null;
    if (dbPool) {
      const res = await dbPool.query(
        `SELECT * FROM profiles WHERE clerk_user_id = $1 LIMIT 1`,
        [clerkUserId]
      );
      return res.rows[0] || null;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (error) {
      logger.error("Error fetching profile from Supabase:", error);
      throw error;
    }
    return data;
  },

  async syncProfile(clerkUserId, { email, fullName, avatarUrl }) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();
    const cleanName = String(fullName || "").trim() || "Student";

    if (dbPool) {
      const res = await dbPool.query(
        `INSERT INTO profiles (clerk_user_id, email, full_name, avatar_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (clerk_user_id) DO UPDATE SET
           email = EXCLUDED.email,
           full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = 'Student' THEN EXCLUDED.full_name ELSE profiles.full_name END,
           avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
           updated_at = NOW()
         RETURNING *`,
        [clerkUserId, cleanEmail, cleanName, avatarUrl || null]
      );
      return res.rows[0];
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          clerk_user_id: clerkUserId,
          email: cleanEmail,
          full_name: cleanName,
          avatar_url: avatarUrl || null,
        },
        { onConflict: "clerk_user_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(clerkUserId, updates) {
    if (!clerkUserId) throw new Error("clerkUserId is required");

    // Strict whitelist — never allow role or privilege modifications via student endpoint
    const allowedFields = [
      "full_name",
      "phone",
      "college_email",
      "roll_number",
      "branch",
      "section",
      "year",
      "semester",
      "avatar_url",
      "bio",
      "linkedin_url",
      "github_url",
      "portfolio_url",
    ];

    const safeUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] =
          typeof updates[field] === "string"
            ? updates[field].trim()
            : updates[field];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return this.getProfileByClerkId(clerkUserId);
    }

    if (dbPool) {
      const keys = Object.keys(safeUpdates);
      const values = Object.values(safeUpdates);
      const setClauses = keys
        .map((k, idx) => `"${k}" = $${idx + 2}`)
        .join(", ");

      const res = await dbPool.query(
        `UPDATE profiles SET ${setClauses}, updated_at = NOW() WHERE clerk_user_id = $1 RETURNING *`,
        [clerkUserId, ...values]
      );
      return res.rows[0];
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(safeUpdates)
      .eq("clerk_user_id", clerkUserId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  },
};
