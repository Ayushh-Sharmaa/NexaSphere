export const ACTIVITY_CATEGORIES = [
  {
    key: "hackathon",
    name: "Hackathon",
    description: "24-48 hour collaborative product sprints and builds.",
    icon: "Code2",
    color: "#CC1111",
    displayOrder: 1,
    enabled: true,
  },
  {
    key: "codathon",
    name: "Codathon",
    description: "Competitive programming, algorithms, and DSA contests.",
    icon: "Terminal",
    color: "#E53E3E",
    displayOrder: 2,
    enabled: true,
  },
  {
    key: "ideathon",
    name: "Ideathon",
    description: "Product ideation, problem solving, and startup pitches.",
    icon: "Lightbulb",
    color: "#DD6B20",
    displayOrder: 3,
    enabled: true,
  },
  {
    key: "promptathon",
    name: "Promptathon",
    description: "AI prompting, LLM engineering, and creative AI workflows.",
    icon: "Sparkles",
    color: "#805AD5",
    displayOrder: 4,
    enabled: true,
  },
  {
    key: "workshop",
    name: "Workshop",
    description: "Hands-on practical technical workshops and masterclasses.",
    icon: "Cpu",
    color: "#3182CE",
    displayOrder: 5,
    enabled: true,
  },
  {
    key: "insight_session",
    name: "Insight Session",
    description: "Expert talks, industry panels, and tech insights.",
    icon: "Users",
    color: "#319795",
    displayOrder: 6,
    enabled: true,
  },
  {
    key: "open_source_day",
    name: "Open Source Day",
    description:
      "Open source contribution drives, Git mastery, and PR sprints.",
    icon: "GitPullRequest",
    color: "#38A169",
    displayOrder: 7,
    enabled: true,
  },
  {
    key: "tech_debate",
    name: "Tech Debate",
    description:
      "Structured debates on emerging technologies, AI ethics, and trends.",
    icon: "MessageSquare",
    color: "#D69E2E",
    displayOrder: 8,
    enabled: true,
  },
];

export const VALID_ACTIVITY_KEYS = new Set(
  ACTIVITY_CATEGORIES.map((c) => c.key)
);

export function isValidActivityKey(key) {
  return typeof key === "string" && VALID_ACTIVITY_KEYS.has(key.toLowerCase());
}
