import { Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { supabaseRequest, HAS_SUPABASE } from "../storage/supabaseClient.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_FILE = path.join(__dirname, "..", "data", "content.json");

const router = Router();

async function readContentSafe() {
  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { events: [], activityEvents: {}, coreTeam: [] };
  }
}

router.get("/", (req, res) => {
  res.json({ ok: true, message: "Analytics endpoint is available." });
});

router.get("/stats", async (_req, res) => {
  try {
    let totalUsers = null;
    let activeRegistrations = null;
    let upcomingEvents = null;
    const conversionRate = null;

    if (HAS_SUPABASE) {
      const [events, submissions] = await Promise.all([
        supabaseRequest("events?select=status"),
        supabaseRequest("form_submissions?select=id,college_email"),
      ]);

      upcomingEvents = events.filter((e) => e.status === "upcoming").length;
      activeRegistrations = submissions.length;

      const uniqueEmails = new Set(
        submissions.map((s) => s.college_email).filter(Boolean)
      );
      totalUsers =
        uniqueEmails.size > 0 ? uniqueEmails.size : submissions.length;
    } else {
      const content = await readContentSafe();
      upcomingEvents = (content.events || []).filter(
        (e) => e.status === "upcoming"
      ).length;
    }

    res.json({
      totalUsers,
      activeRegistrations,
      upcomingEvents,
      conversionRate,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to generate stats" });
  }
});

router.get("/growth", async (_req, res) => {
  try {
    let growth = [];

    if (HAS_SUPABASE) {
      const submissions = await supabaseRequest(
        "form_submissions?select=created_at&order=created_at.asc"
      );
      const dailyCounts = {};

      for (const sub of submissions) {
        if (!sub.created_at) continue;
        const date = sub.created_at.split("T")[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      }

      growth = Object.keys(dailyCounts)
        .sort()
        .map((date) => ({
          date,
          registrations: dailyCounts[date],
        }));
    }

    res.json(growth);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to generate growth data" });
  }
});

router.get("/events", async (_req, res) => {
  try {
    let eventStats = [];

    if (HAS_SUPABASE) {
      const [events, submissions] = await Promise.all([
        supabaseRequest("events?select=id,name"),
        supabaseRequest("form_submissions?select=form_type"),
      ]);

      const countsByFormType = {};
      for (const sub of submissions) {
        if (!sub.form_type) continue;
        countsByFormType[sub.form_type] =
          (countsByFormType[sub.form_type] || 0) + 1;
      }

      eventStats = events.map((e) => ({
        name: e.name,
        capacity: null,
        attendance: countsByFormType[e.id] || 0,
        waitlist: null,
      }));
    }

    res.json(eventStats);
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to generate events data" });
  }
});

export default router;
