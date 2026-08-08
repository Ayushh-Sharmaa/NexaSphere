import { gql } from 'graphql-tag';

export const typeDefs = gql`
  extend schema
    @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type Project @key(fields: "id") {
    id: ID!
    viewCount: Int!
  }

  type Query {
    projectAnalytics(id: ID!): Project
  }
`;
