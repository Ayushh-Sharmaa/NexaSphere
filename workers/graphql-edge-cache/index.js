/**
 * Cloudflare Worker for intercepting and edge-caching GraphQL Queries.
 * Relies on Automatic Persisted Queries (APQ) so queries are sent as GET requests.
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Only cache GET requests (which APQ uses). Pass POSTs (Mutations) directly to origin.
    if (request.method !== 'GET') {
      return fetch(env.ORIGIN_URL, request);
    }

    // Check if it's an APQ request (has 'extensions' param with a hash)
    const extensionsStr = url.searchParams.get('extensions');
    if (!extensionsStr) {
      return fetch(env.ORIGIN_URL, request);
    }

    try {
      const extensions = JSON.parse(extensionsStr);
      const hash = extensions?.persistedQuery?.sha256Hash;
      
      if (hash) {
        // Safe to cache! Let's check the Edge Cache
        const cache = caches.default;
        const cacheKey = new Request(url.toString(), request);
        
        let response = await cache.match(cacheKey);
        
        if (!response) {
          // Cache miss: fetch from Origin
          response = await fetch(env.ORIGIN_URL, request);
          
          // Only cache successful GraphQL responses that don't have GraphQL errors
          if (response.ok) {
            const clonedResponse = response.clone();
            const json = await clonedResponse.json();
            
            if (!json.errors) {
              // Reconstruct response with Cache-Control headers so Cloudflare caches it
              response = new Response(response.body, response);
              response.headers.set('Cache-Control', `s-maxage=${env.CACHE_TTL}`);
              
              // Store in Edge Cache asynchronously
              ctx.waitUntil(cache.put(cacheKey, response.clone()));
            }
          }
        } else {
          // Cache hit: add header for debugging
          response = new Response(response.body, response);
          response.headers.set('X-Edge-Cache', 'HIT');
        }
        
        return response;
      }
    } catch (e) {
      console.error('Failed to parse extensions', e);
    }

    // Fallback to origin
    return fetch(env.ORIGIN_URL, request);
  }
};
