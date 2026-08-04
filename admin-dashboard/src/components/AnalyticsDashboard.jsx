/**
 * Real-time Analytics Dashboard Component
 * Main dashboard for displaying live event metrics
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useEventAnalytics } from '../hooks/useAnalyticsSocket.js';
import { useLogoutAwareInterval } from '../hooks/useLogoutAwareInterval.js';
import analyticsAPI from '../services/analyticsAPI.js';
import { useAuth } from '../context/AuthContext';
import LiveMetricsCards from './LiveMetricsCards';
import RegistrationTrendsChart from './RegistrationTrendsChart';
import RecentRegistrationsList from './RecentRegistrationsList';
import CheckInStatsChart from './CheckInStatsChart';
import AnalyticsExport from './AnalyticsExport';
import { Skeleton } from './Skeleton';
import { DashboardCardSkeleton } from './DashboardCardSkeleton';
import '../styles/analytics-dashboard.css';

export default function AnalyticsDashboard({ eventId }) {
  const { isAuthenticated } = useAuth();
  const { metrics, registrationTrends, recentRegistrations, loading, error, isConnected } =
    useEventAnalytics(eventId);

  const [checkInStats, setCheckInStats] = useState({});
  const [allMetrics, setAllMetrics] = useState([]);
  const [selectedTimeWindow, setSelectedTimeWindow] = useState('7 days');
  const [refreshing, setRefreshing] = useState(false);

  const fetchCheckInStats = useCallback(async () => {
    if (!eventId) return;

    try {
      const stats = await analyticsAPI.getCheckInStats(eventId);
      setCheckInStats(stats);
    } catch (err) {
      console.error('Failed to fetch check-in stats:', err);
    }
  }, [eventId]);
  // Fetch immediately on mount / eventId change
  useEffect(() => {
    if (!eventId) return;
    fetchCheckInStats();
  }, [eventId, fetchCheckInStats]);

  useLogoutAwareInterval(fetchCheckInStats, 10000, Boolean(eventId));

  // Fetch all events metrics for overview
  useEffect(() => {
    const fetchAllMetrics = async () => {
      try {
        const data = await analyticsAPI.getAllEventsMetrics();
        setAllMetrics(data);
      } catch (err) {
        console.error('Failed to fetch all events metrics:', err);
      }
    };

    fetchAllMetrics();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await analyticsAPI.clearCache(eventId);
      // Re-fetch data
      const stats = await analyticsAPI.getCheckInStats(eventId);
      setCheckInStats(stats);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTimeWindowChange = (newWindow) => {
    setSelectedTimeWindow(newWindow);
  };

  if (error) {
    return (
      <div className="analytics-dashboard analytics-error">
        <div className="error-message">
          <h2>Error loading analytics</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-refresh">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Event Analytics Dashboard</h1>
          <p className="subtitle">Real-time event metrics and insights</p>
        </div>
        <div className="header-controls">
          <div className="connection-status">
            <span
              className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}
            ></span>
            <span className="status-text">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-refresh"
            title="Refresh all data"
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {loading && metrics === null ? (
        <>
          <div className="metrics-cards-section">
            <div className="metrics-grid">
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
              <DashboardCardSkeleton />
            </div>
          </div>
          <div className="charts-section">
            <div className="chart-container">
              <Skeleton height={350} />
            </div>
            <div className="chart-container">
              <Skeleton height={350} />
            </div>
          </div>
          <div className="dashboard-bottom">
            <div className="recent-activity">
              <Skeleton height={200} />
            </div>
            <div className="export-section">
              <Skeleton height={200} />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Live Metrics Cards */}
          {metrics && <LiveMetricsCards metrics={metrics} />}

          {/* Charts Section */}
          <div className="charts-section">
            <div className="chart-container">
              <RegistrationTrendsChart
                eventId={eventId}
                selectedTimeWindow={selectedTimeWindow}
                onTimeWindowChange={handleTimeWindowChange}
                data={registrationTrends}
              />
            </div>

            <div className="chart-container">
              <CheckInStatsChart stats={checkInStats} />
            </div>
          </div>

          {/* Recent Activity and Export */}
          <div className="dashboard-bottom">
            <div className="recent-activity">
              <RecentRegistrationsList registrations={recentRegistrations} isLoading={loading} />
            </div>

            <div className="export-section">
              <AnalyticsExport eventId={eventId} />
            </div>
          </div>

          {/* Events Overview */}
          {allMetrics.length > 0 && (
            <div className="events-overview">
              <h2>📈 All Events Overview</h2>
              <div className="events-grid">
                {allMetrics.map((event) => (
                  <div key={event.eventId} className="event-card">
                    <h3>{event.eventName}</h3>
                    <div className="event-stats">
                      <div className="stat">
                        <span className="label">Registrations</span>
                        <span className="value">{event.totalRegistrations}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Checked In</span>
                        <span className="value">{event.checkedIn}</span>
                      </div>
                      <div className="stat">
                        <span className="label">Occupancy</span>
                        <span className="value">{event.occupancyRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
