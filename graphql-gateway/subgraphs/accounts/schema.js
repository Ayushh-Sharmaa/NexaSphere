import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    username: String!
    email: String!
    isActive: Boolean!
  }

  type Query {
    me: User
    user(id: ID!): User
  }
`;
