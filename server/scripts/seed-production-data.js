import pg from "pg";

const connectionString =
  "postgresql://postgres:C7ipl0YyTn8GvgiW@db.nmwxpyhfmszwvsoqoxyq.supabase.co:5432/postgres";

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Seed events
    await client.query(`
      INSERT INTO events (id, name, short_name, starts_at, ends_at, date_text, description, status, icon, tags, capacity)
      VALUES
        ('kss-1', 'Knowledge Sharing Session: Web3 & AI Agents', 'KSS 1.0', '2026-08-25T14:00:00Z', '2026-08-25T17:00:00Z', 'Aug 25, 2026', 'Deep dive into decentralized intelligence, autonomous agent workflows, and smart contract orchestration.', 'upcoming', '🚀', '["AI", "Web3", "Agents"]'::jsonb, 150),
        ('hack-sphere-26', 'HackSphere 2026 — Annual 36h Hackathon', 'HackSphere', '2026-09-12T09:00:00Z', '2026-09-13T21:00:00Z', 'Sep 12-14, 2026', 'Flagship university hackathon with tracks in AI/ML, Cloud Native, Cyber Security, and Open Innovation.', 'upcoming', '⚡', '["Hackathon", "Innovation", "Cash Prizes"]'::jsonb, 300),
        ('code-blitz', 'CodeBlitz DSA Tournament', 'CodeBlitz', '2026-10-05T10:00:00Z', '2026-10-05T13:00:00Z', 'Oct 05, 2026', 'Speed coding and competitive algorithmic challenges across beginner to advanced divisions.', 'upcoming', '🏆', '["DSA", "Algorithms", "Leaderboard"]'::jsonb, 200)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        starts_at = EXCLUDED.starts_at,
        description = EXCLUDED.description;
    `);

    // 2. Seed canonical sample activities across the 8 keys
    await client.query(`
      INSERT INTO activities (id, activity_type, title, tagline, description, date_text, location, status)
      VALUES
        ('act-hack-1', 'hackathon', 'NexaHack 2026: Campus Build', '36 Hours of Non-stop Innovation', 'Build real solutions for campus operations, student life, and local industry.', 'Aug 30, 2026', 'Auditorium & Innovation Lab', 'published'),
        ('act-code-1', 'codathon', 'Algorithmic Arena 2026', 'Battle of Algorithmic Minds', 'Compete against the best problem solvers in GL Bajaj. Ranked live on Codeforces platform.', 'Sep 05, 2026', 'Lab 3 & Virtual', 'published'),
        ('act-idea-1', 'ideathon', 'Startup Nexus Pitch Day', 'Transform Ideas into Ventures', 'Pitch your prototype to angel investors, venture mentors, and industry veterans.', 'Sep 18, 2026', 'Seminar Hall 1', 'published'),
        ('act-prompt-1', 'promptathon', 'PromptCraft AI Showdown', 'Master AI Prompt Engineering', 'Multi-round challenges testing reasoning, few-shot prompting, and creative synthesis.', 'Sep 22, 2026', 'Virtual Online', 'published'),
        ('act-work-1', 'workshop', 'Kubernetes & Cloud Infrastructure', 'From Containers to Microservices', 'Hands-on cluster setup, CI/CD pipeline automation, and production observability.', 'Oct 02, 2026', 'CS Lab 2', 'published'),
        ('act-insight-1', 'insight_session', 'Careers in Generative AI', 'Industry Insights with Lead Engineers', 'Interactive panel session with Google, Microsoft, and high-growth startup founders.', 'Oct 10, 2026', 'Main Auditorium', 'published'),
        ('act-os-1', 'open_source_day', 'Hacktoberfest Kickoff Sprint', 'Ship Your First Global PR', 'Mentorship for open-source contributions, Git workflows, and issue resolution.', 'Oct 15, 2026', 'GLB Incubation Center', 'published'),
        ('act-debate-1', 'tech_debate', 'AGI: Alignment vs Acceleration', 'Oxford-Style Technology Debate', 'Audience-voted intellectual debate on safety bounds and compute scaling.', 'Oct 28, 2026', 'Amphitheatre', 'published')
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        tagline = EXCLUDED.tagline,
        description = EXCLUDED.description;
    `);

    // 3. Seed mentors
    await client.query(`
      INSERT INTO mentors (name, role, company, expertise, bio, is_active)
      VALUES
        ('Dr. A. K. Verma', 'Professor & AI Researcher', 'GL Bajaj', '["Machine Learning", "Computer Vision", "Research"]'::jsonb, 'Guiding student research and national innovation grants.', true),
        ('Ayush Sharma', 'Founder & Community Lead', 'Global Society of Founders / NexaSphere', '["Full-Stack Architecture", "Cloud Native", "Community Scaling"]'::jsonb, 'Building developer ecosystems and execution engines.', true),
        ('Vikramaditya Singh', 'Senior SRE', 'CloudScale Technologies', '["DevOps", "Kubernetes", "Observability"]'::jsonb, 'Mentoring on production infrastructure and microservices reliability.', true)
      ON CONFLICT DO NOTHING;
    `);

    await client.query("COMMIT");
    console.log("Production data seeded successfully on Supabase PostgreSQL!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seeding error:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
