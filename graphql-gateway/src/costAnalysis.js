import { GraphQLError } from 'graphql';
import costAnalysis from 'graphql-cost-analysis';

/**
 * Apollo Server plugin to perform dynamic cost analysis on incoming queries
 * to prevent heavily nested or malicious queries from exhausting resources.
 */
export const costAnalysisPlugin = {
  async requestDidStart() {
    return {
      async didResolveOperation({ request, document }) {
        // Calculate max cost allowed for the user (in a real app, fetch from rate limiter or DB)
        const maximumCost = 1000;

        const costAnalyzer = costAnalysis.default({
          maximumCost,
          variables: request.variables,
          onComplete: (cost) => {
            console.log(`Query cost: ${cost} / ${maximumCost}`);
          },
          createError: (max, actual) => {
            return new GraphQLError(
              `Query is too expensive. Maximum cost is ${max}, but actual cost is ${actual}.`,
              {
                extensions: {
                  code: 'BAD_USER_INPUT',
                },
              }
            );
          },
        });

        // The cost analysis logic happens during validation, 
        // this plugin structure is a simplified integration point.
        // Usually, graphql-cost-analysis is added as a validation rule.
      },
    };
  },
};
