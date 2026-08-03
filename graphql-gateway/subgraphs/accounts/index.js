import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './schema.js';

const resolvers = {
  Query: {
    me: () => ({ id: "1", username: "admin", email: "admin@nexasphere.com", isActive: true }),
    user: (_, { id }) => ({ id, username: `user_${id}`, email: `user${id}@nexasphere.com`, isActive: true })
  },
  User: {
    __resolveReference(reference) {
      return { id: reference.id, username: `user_${reference.id}`, email: `user${reference.id}@nexasphere.com`, isActive: true };
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

const PORT = 4001;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT }
});

console.log(`🚀 Accounts subgraph ready at ${url}`);
