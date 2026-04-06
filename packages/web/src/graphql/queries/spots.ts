import { gql } from '@graphql/client';

export const GET_SPOTS = gql`
query GetSpots($take: Int, $skip: Int) {
  spots(take: $take, skip: $skip) {
    id
    name
  }
}
`;