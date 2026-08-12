import { analyzeSentiment } from "./sentimentAnalyzer";
import { extractThemes, groupThemes } from "./themeExtractor";

const aspectMap = {
  venue: "Venue",
  speaker: "Speaker",
  content: "Content",
  timing: "Timing",
  organization: "Organization",
};

const aspectPatterns = {
  Venue: [
    "venue",
    "room",
    "space",
    "seating",
    "ac",
    "temperature",
    "hot",
    "cold",
  ],
  Speaker: ["speaker", "presenter", "host", "facilitator"],
  Content: ["content", "topic", "material", "session"],
  Timing: ["timing", "time", "late", "schedule", "duration"],
  Organization: [
    "organization",
    "organizer",
    "planning",
    "logistics",
    "registration",
  ],
};

function getAspectSentiment(text) {
  const normalized = text.toLowerCase();
  const matches = Object.entries(aspectPatterns).filter(([, terms]) =>
    terms.some((term) => normalized.includes(term))
  );

  if (!matches.length) return null;

  return matches.map(([aspect]) => ({ aspect, ...analyzeSentiment(text) }));
}

function buildTrendData(entries) {
  const buckets = entries.reduce((acc, entry, index) => {
    const key = entry.date || `Entry ${index + 1}`;
    acc.push({ date: key, sentiment: entry.sentiment });
    return acc;
  }, []);

  return buckets;
}

function buildSuggestions(entries) {
  const suggestionMap = new Map();

  entries.forEach((entry) => {
    const text = `${entry.text || ""} ${entry.suggestions || ""}`.toLowerCase();
    const keyword =
      text.includes("hot") || text.includes("room") ? "Room temperature" : null;
    const food =
      text.includes("food") || text.includes("catering")
        ? "Food/catering"
        : null;
    const timing =
      text.includes("late") || text.includes("timing") ? "Timing" : null;

    [keyword, food, timing].filter(Boolean).forEach((item) => {
      suggestionMap.set(item, (suggestionMap.get(item) || 0) + 1);
    });
  });

  return Array.from(suggestionMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count]) => {
      const suggestionText =
        topic === "Room temperature"
          ? `Increase AC and improve room temperature control (${count} mentions).`
          : topic === "Food/catering"
            ? `Improve catering quality and food variety (${count} mentions).`
            : `Review ${topic.toLowerCase()} feedback and adjust planning (${count} mentions).`;

      return { topic, count, suggestion: suggestionText };
    });
}

export function buildFeedbackAnalyticsReport(feedbackEntries = []) {
  const analyzedEntries = feedbackEntries.map((entry) => {
    const sentiment = analyzeSentiment(entry.text || "");
    const aspectRatings = getAspectSentiment(entry.text || "") || [];
    const themes = extractThemes(entry.text || "");

    return { ...entry, sentiment, aspectRatings, themes };
  });

  const totals = analyzedEntries.reduce(
    (acc, entry) => {
      acc[entry.sentiment.sentiment] =
        (acc[entry.sentiment.sentiment] || 0) + 1;
      return acc;
    },
    { Positive: 0, Negative: 0, Neutral: 0, Mixed: 0 }
  );

  const total = analyzedEntries.length || 1;
  const sentimentPercentages = Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [
      key,
      Number(((value / total) * 100).toFixed(1)),
    ])
  );

  const topThemes = groupThemes(
    analyzedEntries.flatMap((entry) => entry.themes)
  );

  const aspectRatings = Object.fromEntries(
    Object.keys(aspectMap).map((key) => [
      aspectMap[key],
      { sentiment: "Neutral", count: 0 },
    ])
  );

  analyzedEntries.forEach((entry) => {
    entry.aspectRatings.forEach(({ aspect, sentiment }) => {
      const current = aspectRatings[aspect];
      if (current) {
        current.count += 1;
        current.sentiment = sentiment;
      }
    });
  });

  const summary = {
    overallSentiment: analyzedEntries.length
      ? Object.entries(totals).sort((a, b) => b[1] - a[1])[0][0]
      : "Neutral",
    sentimentPercentages,
    topThemes,
    aspectRatings,
    suggestions: buildSuggestions(analyzedEntries),
  };

  return {
    entries: analyzedEntries,
    summary,
    trendData: buildTrendData(analyzedEntries),
  };
}
