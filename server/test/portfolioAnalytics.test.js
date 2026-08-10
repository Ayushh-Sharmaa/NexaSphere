import test from 'node:test';
import assert from 'node:assert';
import { portfolioAnalyticsService } from '../services/portfolioAnalyticsService.js';

test('Portfolio analytics exists', async () => {
  const data = await portfolioAnalyticsService.getAnalytics('john');

test("Portfolio analytics exists", async () => {
  const data =
    await portfolioAnalyticsService.getAnalytics("john");

  assert.ok(data.profileViews);
});

test('Monthly report exists', async () => {
  const report = await portfolioAnalyticsService.getMonthlyReport('john');
test("Monthly report exists", async () => {
  const report =
    await portfolioAnalyticsService.getMonthlyReport("john");

  assert.ok(report.month);
});

test('Visit recording', async () => {
  const visit = await portfolioAnalyticsService.recordVisit('john');

  assert.equal(visit.success, true);
});
test("Visit recording", async () => {
  const visit =
    await portfolioAnalyticsService.recordVisit("john");

  assert.equal(visit.success, true);
});

}
);
}
);