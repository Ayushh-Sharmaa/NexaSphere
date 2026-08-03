import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './schema.js';

const analyticsData = {
  "101": { viewCount: 1500 },
  "102": { viewCount: 320 }
};

const resolvers = {
  Query: {
    projectAnalytics: (_, { id }) => ({ id, ...analyticsData[id] })
  },
  Project: {
    __resolveReference(reference) {
      return { id: reference.id, ...(analyticsData[reference.id] || { viewCount: 0 }) };
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

const PORT = 4003;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT }
});

console.log(`🚀 Analytics subgraph ready at ${url}`);
