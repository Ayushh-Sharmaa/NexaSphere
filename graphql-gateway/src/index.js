import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { ApolloGateway, IntrospectAndCompose } from '@apollo/gateway';
import { costAnalysisPlugin } from './costAnalysis.js';

const server = new ApolloServer({ 
  typeDefs, 
  resolvers,
  // Enable Automatic Persisted Queries (APQ)
  // This allows clients to send GET requests with query hashes,
  // which can be intercepted and cached by Cloudflare Workers at the edge.
  persistedQueries: {
    ttl: 3600 // 1 hour TTL for the hash mapping
  },
});

const PORT = process.env.GATEWAY_PORT || 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
});

console.log(`🚀 GraphQL Gateway ready at ${url}`);
