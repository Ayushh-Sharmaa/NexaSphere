import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    projects: [Project]
  }

  type Project @key(fields: "id") {
    id: ID!
    title: String!
    status: String!
    ownerId: ID!
  }

  type Query {
    projects: [Project]
    project(id: ID!): Project
  }
`;
