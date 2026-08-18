/**
 * Knowledge Assistant Service
 * Mock implementation for AI-Powered Platform Knowledge Assistant
 */

const queryHistory = [];

const documentation = [
  {
    id: 1,
    title: "Getting Started",
    content: "Learn how to use the NexaSphere platform.",
  },
  {
    id: 2,
    title: "Event Registration",
    content: "Register for campus events through the Events module.",
  },
];

const clubs = [
  {
    id: 1,
    name: "Coding Club",
    description: "Programming and competitive coding activities.",
  },
  {
    id: 2,
    name: "Robotics Club",
    description: "Robotics projects and competitions.",
  },
];

const events = [
  {
    id: 1,
    title: "AI Workshop",
    date: "2026-07-15",
    category: "Technology",
  },
  {
    id: 2,
    title: "Hackathon",
    date: "2026-08-02",
    category: "Competition",
  },
];

const faqs = [
  {
    question: "How do I register for an event?",
    answer: "Open the Events page and click Register.",
  },
  {
    question: "How do I join a club?",
    answer: "Visit the Clubs section and submit a membership request.",
  },
];

// Ask AI Question
export const askQuestion = async (data) => {
  const response = {
    question: data.question,
    answer:
      "This is a mock AI-generated response based on the available knowledge base.",
    timestamp: new Date().toISOString(),
  };

  queryHistory.push(response);

  return response;
};

// Natural Language Search
export const naturalSearch = async (query) => {
  if (!query) return [];

  return documentation.filter((doc) =>
    doc.title.toLowerCase().includes(query.toLowerCase())
  );
};

// Documentation Search
export const getDocumentation = async (topic) => {
  if (!topic) return documentation;

  return documentation.filter((doc) =>
    doc.title.toLowerCase().includes(topic.toLowerCase())
  );
};

// Event Recommendations
export const getEventRecommendations = async () => events;

// Club Information
export const getClubInformation = async (club) => {
  if (!club) return clubs;

  return clubs.filter((item) =>
    item.name.toLowerCase().includes(club.toLowerCase())
  );
};

// FAQ Generation
export const generateFAQs = async () => faqs;

// Step-by-Step Guides
export const getGuides = async (topic) => ({
  topic: topic || "General",
  steps: [
    "Open NexaSphere.",
    "Navigate to the required module.",
    "Follow the on-screen instructions.",
    "Submit your request.",
  ],
});

// Smart Search Suggestions
export const getSuggestions = async (query) => {
  if (!query) return [];

  return [
    `${query} documentation`,
    `${query} guide`,
    `${query} events`,
    `${query} clubs`,
  ];
};

// Translation
export const translateResponse = async (data) => ({
  original: data.text,
  translated: data.text,
  language: data.language || "English",
});

// Query History
export const getHistory = async () => queryHistory;

// Feedback
export const submitFeedback = async (data) => ({
  id: Date.now(),
  status: "Received",
  ...data,
});

// Analytics
export const getAnalytics = async () => ({
  totalQueries: queryHistory.length,
  documentationArticles: documentation.length,
  clubsIndexed: clubs.length,
  eventsIndexed: events.length,
  faqCount: faqs.length,
});

// Update Knowledge Base
export const updateKnowledgeBase = async () => ({
  status: "Updated",
  updatedAt: new Date().toISOString(),
});
