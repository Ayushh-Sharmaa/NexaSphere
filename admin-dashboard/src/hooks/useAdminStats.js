// admin-dashboard/src/hooks/useAdminStats.js
// Custom hook that fetches platform stats from GET /api/admin/stats

import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8787";

export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        credentials: 'include', // send session cookie for auth
      });

        const response = await fetch(`${API_BASE}/api/admin/stats`, {
          credentials: "include", // send session cookie for auth
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.status}`);
        }

        const data = await response.json();
        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Poll every 60 seconds; stops automatically on logout
  useLogoutAwareInterval(fetchStats, 60_000);

  return { stats, loading, error };
}
