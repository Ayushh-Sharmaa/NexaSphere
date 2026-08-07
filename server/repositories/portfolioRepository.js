import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { withDb } from "./db.js";
import { Mutex } from "async-mutex";
import {
  sanitizePortfolioRecord,
  sanitizePortfolioOutput,
} from "../utils/sanitize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORTFOLIOS_FILE = path.join(__dirname, "..", "data", "portfolios.json");
const portfolioMutex = new Mutex();

const BCRYPT_ROUNDS = 12;

// Pre-computed bcrypt hash of a fixed dummy string used to ensure
// constant-time bcrypt comparison for non-existing usernames.
// This hash is never a valid passkey for any real user.
const DUMMY_PASSKEY_HASH = bcrypt.hashSync(
  "dummy-timing-constant",
  BCRYPT_ROUNDS
);

async function jitter(min = 20, max = 80) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

let schemaReady = null;
let schemaOk = false;
let lastDbFailTime = 0;
const DB_RETRY_TTL = 15000;

export function canonicalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase();
}

async function hashPasskey(passkey) {
  return bcrypt.hash(String(passkey), BCRYPT_ROUNDS);
}

async function verifyHash(passkey, hash) {
  return bcrypt.compare(String(passkey), hash);
}

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolios (
      username VARCHAR(100) PRIMARY KEY,
      passkey_hash VARCHAR(255) NOT NULL,
      theme VARCHAR(50) DEFAULT 'glassmorphic',
      visible_sections JSONB DEFAULT '{"quests": true, "roadmaps": true, "projects": true, "analytics": false}'::jsonb,
      social_links JSONB DEFAULT '{}'::jsonb,
      custom_domain VARCHAR(255),
      seo_metadata JSONB DEFAULT '{}'::jsonb,
      skills JSONB DEFAULT '[]'::jsonb,
      badges JSONB DEFAULT '[]'::jsonb,
      projects JSONB DEFAULT '[]'::jsonb,
      roadmaps JSONB DEFAULT '[]'::jsonb,
      bio TEXT,
      title TEXT,
      avatar_url VARCHAR(2048) DEFAULT '',
      education JSONB DEFAULT '[]'::jsonb,
      work_experience JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolio_username_case_duplicates_backup (
      backed_up_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      canonical_username VARCHAR(100) NOT NULL,
      portfolio JSONB NOT NULL
    )
  `);

  await client.query(`
    WITH duplicate_rows AS (
      SELECT p.*
      FROM portfolios p
      JOIN (
        SELECT LOWER(TRIM(username)) AS canonical_username
        FROM portfolios
        GROUP BY LOWER(TRIM(username))
        HAVING COUNT(*) > 1
      ) duplicates ON LOWER(TRIM(p.username)) = duplicates.canonical_username
    )
    INSERT INTO portfolio_username_case_duplicates_backup (canonical_username, portfolio)
    SELECT LOWER(TRIM(username)), TO_JSONB(duplicate_rows)
    FROM duplicate_rows
  `);

  await client.query(`
    WITH ranked AS (
      SELECT
        ctid AS row_id,
        ROW_NUMBER() OVER (
          PARTITION BY LOWER(TRIM(username))
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, username ASC
        ) AS rank
      FROM portfolios
    )
    DELETE FROM portfolios p
    USING ranked
    WHERE p.ctid = ranked.row_id
      AND ranked.rank > 1
  `);

  await client.query(`
    UPDATE portfolios
    SET username = LOWER(TRIM(username))
    WHERE username <> LOWER(TRIM(username))
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_username_lower_unique
    ON portfolios (LOWER(username))
  `);
}

async function ensureReady() {
  if (schemaOk) return true;

  if (schemaReady) {
    try {
      await schemaReady;
      return true;
    } catch {
      return false;
    }
  }

  const now = Date.now();
  if (now - lastDbFailTime < DB_RETRY_TTL) {
    return false;
  }

  schemaReady = withDb(async (client) => {
    await ensureSchema(client);
  })
    .then(() => {
      schemaOk = true;
    })
    .catch((err) => {
      schemaReady = null;
      lastDbFailTime = Date.now();
      throw err;
    });

  try {
    await schemaReady;
    return true;
  } catch (err) {
    console.warn("PostgreSQL not available:", err.message);
    return false;
  }
}

// Local File Store Helpers
async function ensureLocalFile() {
  const dir = path.dirname(PORTFOLIOS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(PORTFOLIOS_FILE);
  } catch {
    await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify({}, null, 2), "utf8");
  }
}

async function readLocalPortfolios() {
  await ensureLocalFile();
  const raw = await fs.readFile(PORTFOLIOS_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeLocalPortfolios(data) {
  await ensureLocalFile();
  await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify(data, null, 2), "utf8");
}

function mapRow(row) {
  if (!row) return null;
  const raw = {
    username: row.username,
    theme: row.theme,
    visibleSections:
      typeof row.visible_sections === "string"
        ? JSON.parse(row.visible_sections)
        : row.visible_sections || {},
    socialLinks:
      typeof row.social_links === "string"
        ? JSON.parse(row.social_links)
        : row.social_links || {},
    customDomain: row.custom_domain || "",
    seoMetadata:
      typeof row.seo_metadata === "string"
        ? JSON.parse(row.seo_metadata)
        : row.seo_metadata || {},
    skills:
      typeof row.skills === "string"
        ? JSON.parse(row.skills)
        : row.skills || [],
    badges:
      typeof row.badges === "string"
        ? JSON.parse(row.badges)
        : row.badges || [],
    projects:
      typeof row.projects === "string"
        ? JSON.parse(row.projects)
        : row.projects || [],
    roadmaps:
      typeof row.roadmaps === "string"
        ? JSON.parse(row.roadmaps)
        : row.roadmaps || [],
    bio: row.bio || "",
    title: row.title || "",
    avatarUrl: row.avatar_url || "",
    education:
      typeof row.education === "string"
        ? JSON.parse(row.education)
        : row.education || [],
    workExperience:
      typeof row.work_experience === "string"
        ? JSON.parse(row.work_experience)
        : row.work_experience || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  // Defense-in-depth: sanitize on read so that content written by
  // older code (or any future bypass) cannot reach the client.
  return sanitizePortfolioOutput(raw);
}

export const portfolioRepository = {
  async getByUsername(username) {
    const isDbAvailable = await ensureReady();
    const sanitizedUsername = canonicalizeUsername(username);

    if (isDbAvailable) {
      try {
        return await withDb(async (client) => {
          const { rows } = await client.query(
            "SELECT * FROM portfolios WHERE username = $1",
            [sanitizedUsername]
          );
          if (!rows.length) return null;
          return mapRow(rows[0]);
        });
      } catch (err) {
        console.error(
          "Database query failed. Falling back to local file.",
          err
        );
      }
    }

    // Local file fallback
    const portfolios = await readLocalPortfolios();
    const portfolio = portfolios[sanitizedUsername];
    if (!portfolio) return null;
    return sanitizePortfolioOutput({
      username: portfolio.username,
      theme: portfolio.theme,
      visibleSections: portfolio.visibleSections || {},
      socialLinks: portfolio.socialLinks || {},
      customDomain: portfolio.customDomain || "",
      seoMetadata: portfolio.seoMetadata || {},
      skills: portfolio.skills || [],
      badges: portfolio.badges || [],
      projects: portfolio.projects || [],
      roadmaps: portfolio.roadmaps || [],
      bio: portfolio.bio || "",
      title: portfolio.title || "",
      avatarUrl: portfolio.avatarUrl || "",
      education: portfolio.education || [],
      workExperience: portfolio.workExperience || [],
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    });
  },

  /**
   * Verify that the provided passkey is correct for the given username.
   *
   * @param {string} username
   * @param {string} passkey
   * @param {object} [options]
   * @param {boolean} [options.allowNew=false] - When true, a non-existent username
   *   is treated as a new registration and the passkey is accepted unconditionally.
   *   When false (default), a non-existent username returns false so that callers
   *   cannot bypass authentication by supplying an unrecognised username.
   */
  async verifyPasskey(username, passkey, { allowNew = false } = {}) {
    const isDbAvailable = await ensureReady();
    const sanitizedUsername = canonicalizeUsername(username);

    let isValid;

    if (isDbAvailable) {
      try {
        isValid = await withDb(async (client) => {
          const { rows } = await client.query(
            "SELECT passkey_hash FROM portfolios WHERE username = $1",
            [sanitizedUsername]
          );
          if (!rows.length) {
            // Constant-time: always run bcrypt compare even for non-existing users
            // to prevent timing-based username enumeration.
            await verifyHash(passkey, DUMMY_PASSKEY_HASH);
            return allowNew;
          }
          return await verifyHash(passkey, rows[0].passkey_hash);
        });
      } catch (err) {
        console.error(
          "Database query failed in verifyPasskey. Falling back to local file.",
          err
        );
      }
    }

    if (isValid === undefined) {
      // Local file fallback (read-only cache — fail closed when user is unknown)
      const portfolios = await readLocalPortfolios();
      const portfolio = portfolios[sanitizedUsername];
      if (!portfolio) {
        await verifyHash(passkey, DUMMY_PASSKEY_HASH);
        isValid = allowNew;
      } else {
        isValid = await verifyHash(passkey, portfolio.passkeyHash);
      }
    }

    if (!isValid) {
      // Add random jitter to further obscure timing differences
      await jitter();
    }

    return isValid;
  },

  async createOrUpdate(data, isNewRegistration) {
    const isDbAvailable = await ensureReady();

    // Sanitize the entire record before any I/O so the database
    // never holds raw HTML, javascript: URLs, or oversized strings.
    // The Zod schema in the route handler catches the same
    // problems earlier, but the repository is the last line of
    // defense and is callable from other code paths (background
    // jobs, seeders, tests).
    const clean = sanitizePortfolioRecord(data);

    const sanitizedUsername =
      clean.username || canonicalizeUsername(data.username);
    const passkeyHash = await hashPasskey(clean.passkey || data.passkey);

    const theme = clean.theme || "glassmorphic";
    const visibleSections = clean.visibleSections;
    const socialLinks = clean.socialLinks;
    const customDomain = clean.customDomain || "";
    const seoMetadata = clean.seoMetadata;
    const skills = clean.skills;
    const badges = clean.badges;
    const projects = clean.projects;
    const roadmaps = clean.roadmaps;
    const bio = clean.bio;
    const title = clean.title;
    const avatarUrl = clean.avatarUrl || "";
    const education = clean.education || [];
    const workExperience = clean.workExperience || [];

    if (isDbAvailable) {
      try {
        return await withDb(async (client) => {
          const { rows } = await client.query(
            `INSERT INTO portfolios (
              username, passkey_hash, theme, visible_sections, social_links,
              custom_domain, seo_metadata, skills, badges, projects, roadmaps, bio, title, avatar_url, education, work_experience, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            ON CONFLICT (username) DO UPDATE SET
              passkey_hash = EXCLUDED.passkey_hash,
              theme = EXCLUDED.theme,
              visible_sections = EXCLUDED.visible_sections,
              social_links = EXCLUDED.social_links,
              custom_domain = EXCLUDED.custom_domain,
              seo_metadata = EXCLUDED.seo_metadata,
              skills = EXCLUDED.skills,
              badges = EXCLUDED.badges,
              projects = EXCLUDED.projects,
              roadmaps = EXCLUDED.roadmaps,
              bio = EXCLUDED.bio,
              title = EXCLUDED.title,
              avatar_url = EXCLUDED.avatar_url,
              education = EXCLUDED.education,
              work_experience = EXCLUDED.work_experience,
              updated_at = NOW()
            RETURNING *`,
            [
              sanitizedUsername,
              passkeyHash,
              theme,
              JSON.stringify(visibleSections),
              JSON.stringify(socialLinks),
              customDomain,
              JSON.stringify(seoMetadata),
              JSON.stringify(skills),
              JSON.stringify(badges),
              JSON.stringify(projects),
              JSON.stringify(roadmaps),
              bio,
              title,
              avatarUrl,
              JSON.stringify(education),
              JSON.stringify(workExperience),
            ]
          );
          return mapRow(rows[0]);
        });
      } catch (err) {
        if (err.code === "23505") {
          throw err; // Bubble up unique constraint violation
        }
        console.error(
          "Database INSERT/UPDATE failed. Falling back to local file.",
          err
        );
      }
    }

    // Local file fallback
    return await portfolioMutex.runExclusive(async () => {
      const portfolios = await readLocalPortfolios();
      const now = new Date().toISOString();
      const existing = portfolios[sanitizedUsername] || { createdAt: now };

      const updatedPortfolio = {
        username: sanitizedUsername,
        passkeyHash,
        theme,
        visibleSections,
        socialLinks,
        customDomain,
        seoMetadata,
        skills,
        badges,
        projects,
        roadmaps,
        bio,
        title,
        avatarUrl,
        education,
        workExperience,
        createdAt: existing.createdAt,
        updatedAt: now,
      };
      portfolios[sanitizedUsername] = updatedPortfolio;
      await writeLocalPortfolios(portfolios);

      return sanitizePortfolioOutput(updatedPortfolio);
    });
  },

  async listAll() {
    const isDbAvailable = await ensureReady();
    if (isDbAvailable) {
      try {
        return await withDb(async (client) => {
          const { rows } = await client.query(
            "SELECT * FROM portfolios ORDER BY updated_at DESC"
          );
          return rows.map(mapRow);
        });
      } catch (err) {
        console.error("Failed to list portfolios:", err);
      }
    }
    return [];
  },

  async delete(username) {
    const isDbAvailable = await ensureReady();
    if (isDbAvailable) {
      return withDb(async (client) => {
        await client.query("DELETE FROM portfolios WHERE username = $1", [
          username,
        ]);
      });
    }
    throw new Error("Portfolio storage is unavailable");
  },
};

function resetState() {
  schemaReady = null;
  schemaOk = false;
  lastDbFailTime = 0;
}

export const __portfolioRepositoryInternals = {
  ensureSchema,
  resetState,
};
