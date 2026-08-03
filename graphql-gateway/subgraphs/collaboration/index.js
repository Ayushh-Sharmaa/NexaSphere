import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefs } from './schema.js';

const projects = [
  { id: "101", title: "NexaSphere Launch", status: "ACTIVE", ownerId: "1" },
  { id: "102", title: "Marketing Campaign", status: "PLANNING", ownerId: "2" }
];

const resolvers = {
  Query: {
    projects: () => projects,
    project: (_, { id }) => projects.find(p => p.id === id)
  },
  Project: {
    __resolveReference(reference) {
      return projects.find(p => p.id === reference.id);
    }
  },
  User: {
    projects(user) {
      return projects.filter(p => p.ownerId === user.id);
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers })
});

const PORT = 4002;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT }
});

console.log(`🚀 Collaboration subgraph ready at ${url}`);
