import os
import re

filepath = r'admin-dashboard/src/services/analyticsAPI.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a cache
cache_code = '''
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
'''

# We need to replace all direct etch(...) with etchWithCache(...) inside analyticsAPI object.
# Actually, since the methods unpack .json() and .data, the helper etchWithCache does it.
content = content.replace("const analyticsAPI = {", cache_code + "\nconst analyticsAPI = {")

# Let's replace the bodies of getRegistrationTrends, getHourlyTrends, getCheckInStats
# Since there are multiple methods doing similar fetch, we can replace const response = await fetch( with eturn await fetchWithCache( and remove the rest.
# But it's easier to just write a robust python script.
