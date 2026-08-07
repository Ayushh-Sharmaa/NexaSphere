import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const CONTENT_FILE = path.join(__dirname, "..", "data", "content.json");

export const DEFAULT_CONTENT = {
  events: [
    {
      id: "kss-153",
      name: "KSS #153 — Knowledge Sharing Session",
      shortName: "KSS #153",
      date: "March 14, 2025",
      description:
        "NexaSphere's inaugural Knowledge Sharing Session focused on the impact of AI.",
      status: "completed",
      icon: "Brain",
      tags: ["AI", "Learning", "Community"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  activityEvents: {},
  coreTeam: [],
};

export async function ensureContentFile() {
  const dir = path.dirname(CONTENT_FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await fs.writeFile(
      CONTENT_FILE,
      JSON.stringify(DEFAULT_CONTENT, null, 2),
      "utf8"
    );
  }
}

export async function readContent() {
  await ensureContentFile();
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  return JSON.parse(raw || "{}");
}

export async function writeContent(content) {
  await ensureContentFile();
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}
