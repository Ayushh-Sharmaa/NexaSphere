import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { withDb } from './db.js';
import { Mutex } from 'async-mutex';
import { sanitizePortfolioRecord, sanitizePortfolioOutput } from '../utils/sanitize.js';
import { getCache, setCache, invalidateCache } from '../config/redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORTFOLIOS_FILE = path.join(__dirname, '..', 'data', 'portfolios.json');
const portfolioMutex = new Mutex();

const BCRYPT_ROUNDS = 12;

// Pre-computed bcrypt hash of a fixed dummy string used to ensure
// constant-time bcrypt comparison for non-existing usernames.
// This hash is never a valid passkey for any real user.
const DUMMY_PASSKEY_HASH = bcrypt.hashSync('dummy-timing-constant', BCRYPT_ROUNDS);

async function jitter(min = 20, max = 80) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

let schemaReady = null;
let schemaOk = false;
let lastDbFailTime = 0;
const DB_RETRY_TTL = 15000;

export function canonicalizeUsername(username) {
  return String(username || '')
    .trim()
    .toLowerCase();
}

async function hashPasskey(passkey) {
  return bcrypt.hash(String(passkey), BCRYPT_ROUNDS);
}

async function verifyHash(passkey, hash) {
  return bcrypt.compare(String(passkey), hash);


function hashPasskey(passkey) {
  return crypto.createHash('sha256').update(String(passkey)).digest('hex');
}

async function ensureSchema(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolios (
      username VARCHAR(100) PRIMARY KEY,
      passkey_hash VARCHAR(255) NOT NULL,
      is_public BOOLEAN DEFAULT true,
      theme VARCHAR(50) DEFAULT 'glassmorphic',
      customization JSONB DEFAULT '{}'::jsonb,
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
      github_username VARCHAR(39),
      moderation_status VARCHAR(20) DEFAULT 'approved',
      flag_reason TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await client.query(`
    ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS github_username VARCHAR(39)
  `);

  await client.query(`
    ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true
    ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved',
                           ADD COLUMN IF NOT EXISTS flag_reason TEXT
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

  await client.query(`
    CREATE TABLE IF NOT EXISTS portfolio_skill_endorsements (
      id SERIAL PRIMARY KEY,
      portfolio_username VARCHAR(100) REFERENCES portfolios(username) ON DELETE CASCADE,
      skill_name VARCHAR(100) NOT NULL,
      endorser_id VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(portfolio_username, skill_name, endorser_id)
    )
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
    console.warn('PostgreSQL not available:', err.message);
    return false;
  }
}

async function ensureReady() {
  if (schemaReady) return schemaReady;
  
  // Check if we can connect to PostgreSQL
  try {
    schemaReady = withDb(async (client) => {
      await ensureSchema(client);
      return true;
    });
    await schemaReady;
  } catch (err) {
    console.warn('PostgreSQL is not configured or not available. Falling back to local file storage for portfolios.', err.message);
    schemaReady = Promise.resolve(false);
  }
  return schemaReady;
}

// Local File Store Helpers
async function ensureLocalFile() {
  const dir = path.dirname(PORTFOLIOS_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(PORTFOLIOS_FILE);
  } catch {
    await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify({}, null, 2), 'utf8');
  }
}

async function readLocalPortfolios() {
  await ensureLocalFile();
  const raw = await fs.readFile(PORTFOLIOS_FILE, 'utf8');
  return JSON.parse(raw);
}

async function writeLocalPortfolios(data) {
  await ensureLocalFile();
  await fs.writeFile(PORTFOLIOS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function mapRow(row) {
  if (!row) return null;
  const raw = {
    username: row.username,
    isPublic: row.is_public !== undefined ? row.is_public : true,
    theme: row.theme,
    customization:
      typeof row.customization === 'string'
        ? JSON.parse(row.customization)
        : row.customization || {},
    visibleSections:
      typeof row.visible_sections === 'string'
        ? JSON.parse(row.visible_sections)
        : row.visible_sections || {},
    socialLinks:
      typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links || {},
    customDomain: row.custom_domain || '',
    seoMetadata:
      typeof row.seo_metadata === 'string' ? JSON.parse(row.seo_metadata) : row.seo_metadata || {},
    username: row.username,
    theme: row.theme,
    visibleSections:
      typeof row.visible_sections === 'string'
        ? JSON.parse(row.visible_sections)
        : row.visible_sections || {},
    socialLinks:
      typeof row.social_links === 'string' ? JSON.parse(row.social_links) : row.social_links || {},
    customDomain: row.custom_domain || '',
    seoMetadata:
      typeof row.seo_metadata === 'string' ? JSON.parse(row.seo_metadata) : row.seo_metadata || {},
    skills: typeof row.skills === 'string' ? JSON.parse(row.skills) : row.skills || [],
    badges: typeof row.badges === 'string' ? JSON.parse(row.badges) : row.badges || [],
    projects: typeof row.projects === 'string' ? JSON.parse(row.projects) : row.projects || [],
    roadmaps: typeof row.roadmaps === 'string' ? JSON.parse(row.roadmaps) : row.roadmaps || [],
    bio: row.bio || '',
    title: row.title || '',
    avatarUrl: row.avatar_url || '',
    education: typeof row.education === 'string' ? JSON.parse(row.education) : row.education || [],
    workExperience:
      typeof row.work_experience === 'string'
        ? JSON.parse(row.work_experience)
        : row.work_experience || [],
    githubUsername: row.github_username || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  // Defense-in-depth: sanitize on read so that content written by
  // older code (or any future bypass) cannot reach the client.
  return sanitizePortfolioOutput(raw);
}

}
export const portfolioRepository = {
  async getByUsername(username, { includeDeleted = false } = {}) {
    const isDbAvailable = await ensureReady();
    const sanitizedUsername = canonicalizeUsername(username);
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}


function resetState() {
  schemaReady = null;
  schemaOk = false;
  lastDbFailTime = 0;
}

export const __portfolioRepositoryInternals = {
  ensureSchema,
  resetState,
    const portfolios = await readLocalPortfolios();
    const now = new Date().toISOString();
    const existing = portfolios[sanitizedUsername] || { createdAt: now };

    const updatedPortfolio = {
      username,
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
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    portfolios[sanitizedUsername] = updatedPortfolio;
    await writeLocalPortfolios(portfolios);

    return {
      username: updatedPortfolio.username,
      theme: updatedPortfolio.theme,
      visibleSections: updatedPortfolio.visibleSections,
      socialLinks: updatedPortfolio.socialLinks,
      customDomain: updatedPortfolio.customDomain,
      seoMetadata: updatedPortfolio.seoMetadata,
      skills: updatedPortfolio.skills,
      badges: updatedPortfolio.badges,
      projects: updatedPortfolio.projects,
      roadmaps: updatedPortfolio.roadmaps,
      bio: updatedPortfolio.bio,
      title: updatedPortfolio.title,
      createdAt: updatedPortfolio.createdAt,
      updatedAt: updatedPortfolio.updatedAt,
    };
  }
};
