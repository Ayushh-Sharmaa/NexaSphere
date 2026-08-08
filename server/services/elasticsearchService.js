import { Client } from '@elastic/elasticsearch';

const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
let client;

try {
  client = new Client({ node: ELASTICSEARCH_URL });
} catch (e) {
  console.warn('Elasticsearch client init failed, check ELASTICSEARCH_URL:', e.message);
}

export const elasticsearchService = {
  async indexDocument(index, id, document) {
    if (!client) return;
    try {
      await client.index({
        index,
        id: String(id),
        document,
      });
      // Optionally refresh for real-time visibility in small datasets/tests
      await client.indices
        .refresh({ index })
        .catch((err) => console.error('Elasticsearch refresh error:', err.message));
    } catch (e) {
      console.error(`Elasticsearch index error on [${index}]:`, e.message);
    }
  },

  async deleteDocument(index, id) {
    if (!client) return;
    try {
      await client.delete({ index, id: String(id) });
    } catch (e) {
      console.error(`Elasticsearch delete error on [${index}]:`, e.message);
    }
  },

  async search(query, type = 'all', limit = 20, skip = 0) {
    if (!client) return [];

    try {
      const index = type === 'all' ? '*' : type;

      const response = await client.search({
        index,
        from: skip,
        size: limit,
        body: {
          query: {
            multi_match: {
              query,
              fuzziness: 'AUTO',
              fields: ['title^3', 'description^2', 'tags', 'skills', 'category', 'location'],
            },
          },
        },
      });

      return response.hits.hits.map((h) => ({
        ...h._source,
        score: h._score,
      }));
    } catch (e) {
      console.error('Elasticsearch search error:', e.message);
      return [];
    }
  },
};
