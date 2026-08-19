/**
 * settingsService.js
 * server/services/settingsService.js
 *
 * Thin service wrapping the `settings` table in Supabase.
 * All mutations go through supabaseAdmin (service-role key), bypassing RLS.
 * Public reads can use supabase (anon client) since the table has a public
 * SELECT policy, but supabaseAdmin is used here for consistency and to avoid
 * needing the anon client in server code.
 */

import { supabaseAdmin } from "../config/supabase.js";
import logger from "../utils/logger.js";

export const settingsService = {
  /**
   * Get a single setting by key.
   * Returns the parsed JS value (boolean, string, number, object) from the
   * JSONB `value` column, or `null` if the key does not exist.
   */
  async get(key) {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      logger.error(
        `[settingsService] Failed to get key "${key}":`,
        error.message
      );
      throw error;
    }
    if (!data) return null;
    return data.value;
  },

  /**
   * Get multiple settings at once.
   * Returns a plain object: { [key]: parsedValue }
   * Missing keys are not included in the result.
   */
  async getMany(keys) {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("key, value")
      .in("key", keys);

    if (error) {
      logger.error(`[settingsService] Failed to getMany:`, error.message);
      throw error;
    }

    return (data || []).reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  /**
   * Set a setting key to a new value.
   * Uses upsert so the row is created if it does not exist yet.
   *
   * @param {string} key  - Setting key (TEXT PRIMARY KEY)
   * @param {*}      value - Any JSON-serializable value
   * @param {string} [updatedBy] - Clerk user ID of admin performing the change
   */
  async set(key, value, updatedBy = "system") {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .upsert(
        {
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy,
        },
        { onConflict: "key" }
      )
      .select()
      .single();

    if (error) {
      logger.error(
        `[settingsService] Failed to set key "${key}":`,
        error.message
      );
      throw error;
    }

    logger.info(
      `[settingsService] Set "${key}" = ${JSON.stringify(value)} by ${updatedBy}`
    );
    return data;
  },

  /**
   * Convenience: get the recruitment status object used by the public API.
   * Returns safe defaults (membership open, core team closed) if the table
   * is unreachable or the rows don't exist yet.
   */
  async getRecruitmentStatus() {
    try {
      const settings = await this.getMany([
        "core_team_recruitment_open",
        "membership_open",
      ]);
      return {
        core_team_open: settings.core_team_recruitment_open ?? false,
        membership_open: settings.membership_open ?? true,
      };
    } catch (err) {
      logger.warn(
        "[settingsService] getRecruitmentStatus fell back to defaults:",
        err.message
      );
      // Fail-safe defaults: membership open, core team closed
      return { core_team_open: false, membership_open: true };
    }
  },
};
