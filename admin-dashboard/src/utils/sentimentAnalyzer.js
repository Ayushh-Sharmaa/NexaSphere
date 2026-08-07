const positiveWords = [
  'great',
  'excellent',
  'amazing',
  'good',
  'love',
  'nice',
  'fantastic',
  'perfect',
  'helpful',
  'informative',
  'smooth',
  'well',
  'awesome',
  'wonderful',
  'impressive',
];
const negativeWords = [
  'bad',
  'poor',
  'terrible',
  'hate',
  'awful',
  'boring',
  'late',
  'slow',
  'confusing',
  'messy',
  'hot',
  'cold',
  'issues',
  'problem',
  'complaint',
  'disappointing',
];
const neutralWords = ['okay', 'fine', 'average', 'fair', 'decent'];

export function analyzeSentiment(text = '') {
  const normalized = text.toLowerCase();
  const positiveHits = positiveWords.filter((word) => normalized.includes(word)).length;
  const negativeHits = negativeWords.filter((word) => normalized.includes(word)).length;
  const neutralHits = neutralWords.filter((word) => normalized.includes(word)).length;

  const score = positiveHits - negativeHits + neutralHits * 0.1;
  let sentiment = 'Neutral';
  let confidence = 0.5;

  if (score >= 1.5) {
    sentiment = 'Positive';
    confidence = Math.min(0.95, 0.6 + positiveHits * 0.08);
  } else if (score <= -1.5) {
    sentiment = 'Negative';
    confidence = Math.min(0.95, 0.6 + negativeHits * 0.08);
  } else if (positiveHits && negativeHits) {
    sentiment = 'Mixed';
    confidence = Math.min(0.9, 0.65 + Math.max(positiveHits, negativeHits) * 0.05);
  } else if (positiveHits || negativeHits || neutralHits) {
    sentiment = 'Neutral';
    confidence = Math.min(0.85, 0.55 + Math.max(positiveHits, negativeHits, neutralHits) * 0.05);
  }

  return { sentiment, confidence: Number(confidence.toFixed(2)) };
}
