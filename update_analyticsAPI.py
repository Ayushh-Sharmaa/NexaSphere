import os
import re

filepath = r'admin-dashboard/src/services/analyticsAPI.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the methods: getAllEventsMetrics, getEventMetrics, getRegistrationTrends, getHourlyTrends, getRecentRegistrations, getCheckInStats
# Let's just do a blanket regex replacement for all methods that do fetch().
# Actually, since I have multi_replace_file_content tool, I can just write the whole file with a python script or replace parts.

replacement = '''
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const apiCache = new Map();

const fetchWithCache = async (url, options) => {
  const cacheKey = url;
  if (apiCache.has(cacheKey)) {
    const { data, timestamp } = apiCache.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error('API request failed');
  }
  const responseData = await response.json();
  const result = responseData.data || responseData;
  apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};

const analyticsAPI = {
  clearCache(eventId) {
    if (eventId) {
      for (const key of apiCache.keys()) {
        if (key.includes(eventId)) {
          apiCache.delete(key);
        }
      }
    } else {
      apiCache.clear();
    }
  },

  async getAllEventsMetrics() {
    return await fetchWithCache(${API_URL}/admin/analytics/events, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  },

  async getEventMetrics(eventId) {
    return await fetchWithCache(${API_URL}/admin/analytics/events/, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  },

  async getRegistrationTrends(eventId, timeWindow = '7 days') {
    return await fetchWithCache(
      ${API_URL}/admin/analytics/events//trends?timeWindow=,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
    );
  },

  async getHourlyTrends(eventId, hours = 24) {
    return await fetchWithCache(
      ${API_URL}/admin/analytics/events//trends/hourly?hours=,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
    );
  },

  async getRecentRegistrations(eventId, limit = 20) {
    return await fetchWithCache(
      ${API_URL}/admin/analytics/events//registrations/recent?limit=,
      { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }
    );
  },

  async getCheckInStats(eventId) {
    return await fetchWithCache(${API_URL}/admin/analytics/events//checkins/stats, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
  },
};
'''

content = re.sub(r'const analyticsAPI = {.*', replacement, content, flags=re.DOTALL)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
