import { useState, useEffect } from 'react';
import { getApiBase } from '../../utils/runtimeConfig';

export interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
}

export interface AnalyticsDataState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  isOffline?: boolean;
  trendData?: any;
  distributionData?: any;
  comparisonData?: any;
  overviewMetrics?: any;
}

export function useAnalyticsData(): AnalyticsDataState {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const base = getApiBase();
        const response = await fetch(`${base}/api/analytics`);

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
        }

        const json: AnalyticsData = await response.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
