import { describe, expect, it } from 'vitest';
import { buildFeedbackAnalyticsReport } from '../../utils/analyticsHelpers';

describe('buildFeedbackAnalyticsReport', () => {
  it('returns sentiment, aspect, theme, and suggestion data for feedback entries', () => {
    const report = buildFeedbackAnalyticsReport([
      { id: 1, text: 'Great speaker but poor venue and the room was too hot.' },
      { id: 2, text: 'The content was informative and the timing was perfect.' },
    ]);

    expect(report.summary.overallSentiment).toBeTruthy();
    expect(report.summary.sentimentPercentages).toEqual(
      expect.objectContaining({
        Positive: expect.any(Number),
        Negative: expect.any(Number),
        Neutral: expect.any(Number),
        Mixed: expect.any(Number),
      })
    );
    expect(report.summary.topThemes.length).toBeGreaterThan(0);
    expect(report.summary.aspectRatings).toEqual(
      expect.objectContaining({
        Venue: expect.any(Object),
        Speaker: expect.any(Object),
        Content: expect.any(Object),
        Timing: expect.any(Object),
        Organization: expect.any(Object),
      })
    );
    expect(report.summary.suggestions.length).toBeGreaterThan(0);
  });
});
