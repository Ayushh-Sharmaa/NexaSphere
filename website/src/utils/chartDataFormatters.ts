import { TimeGranularity } from '../context/AnalyticsFilterContext';

export interface TrendDataPoint {
  name: string;
  users: number;
  activity: number;
  projects: number;
}

export interface DistributionDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface ComparisonDataPoint {
  category: string;
  contributions: number;
  issues: number;
  pullRequests: number;
}

export const generateTrendData = (
  granularity: TimeGranularity,
  monthsBack: number = 6
): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const now = new Date();

  const points =
    granularity === 'monthly'
      ? monthsBack
      : granularity === 'weekly'
        ? monthsBack * 4
        : monthsBack * 30;

  let currentUsers = 1000;
  let currentActivity = 5000;
  let currentProjects = 50;

  for (let i = points; i >= 0; i--) {
    const d = new Date(now);
    if (granularity === 'monthly') d.setMonth(now.getMonth() - i);
    else if (granularity === 'weekly') d.setDate(now.getDate() - i * 7);
    else d.setDate(now.getDate() - i);

    currentUsers += Math.floor(Math.random() * 200) - 50;
    currentActivity += Math.floor(Math.random() * 800) - 200;
    currentProjects += Math.floor(Math.random() * 15) - 2;

    const name =
      granularity === 'monthly'
        ? d.toLocaleString('default', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    data.push({
      name,
      users: Math.max(0, currentUsers),
      activity: Math.max(0, currentActivity),
      projects: Math.max(0, currentProjects),
    });
  }

  return data;
};

export const generateDistributionData = (categories: string[]): DistributionDataPoint[] => {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  return categories.map((cat, i) => ({
    name: cat,
    value: Math.floor(Math.random() * 500) + 100,
    fill: colors[i % colors.length],
  }));
};

export const generateComparisonData = (categories: string[]): ComparisonDataPoint[] => {
  return categories.map((cat) => ({
    category: cat,
    contributions: Math.floor(Math.random() * 1000) + 200,
    issues: Math.floor(Math.random() * 300) + 50,
    pullRequests: Math.floor(Math.random() * 200) + 20,
  }));
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};
