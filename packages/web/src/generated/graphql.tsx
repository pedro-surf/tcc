import { useQuery, UseQueryOptions } from '@tanstack/react-query';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };

function fetcher<TData, TVariables>(endpoint: string, requestInit: RequestInit, query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(endpoint, {
      method: 'POST',
      ...requestInit,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Mutation = {
  __typename?: 'Mutation';
  createSpot: Spot;
  createUser: User;
};


export type MutationCreateSpotArgs = {
  data: SpotCreateInput;
};


export type MutationCreateUserArgs = {
  data: UserCreateInput;
};

export type Query = {
  __typename?: 'Query';
  spots: Array<Spot>;
  users: Array<User>;
};


export type QuerySpotsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export type Spot = {
  __typename?: 'Spot';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type SpotCreateInput = {
  difficulty?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  type?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type UserCreateInput = {
  email: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};

export type GetSpotsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSpotsQuery = { __typename?: 'Query', spots: Array<{ __typename?: 'Spot', id: string, name: string }> };



export const GetSpotsDocument = new TypedDocumentString(`
    query GetSpots($take: Int, $skip: Int) {
  spots(take: $take, skip: $skip) {
    id
    name
  }
}
    `);

export const useGetSpotsQuery = <
      TData = GetSpotsQuery,
      TError = unknown
    >(
      dataSource: { endpoint: string, fetchParams?: RequestInit },
      variables?: GetSpotsQueryVariables,
      options?: UseQueryOptions<GetSpotsQuery, TError, TData>
    ) => {
    
    return useQuery<GetSpotsQuery, TError, TData>(
      variables === undefined ? ['GetSpots'] : ['GetSpots', variables],
      fetcher<GetSpotsQuery, GetSpotsQueryVariables>(dataSource.endpoint, dataSource.fetchParams || {}, GetSpotsDocument, variables),
      options
    )};

useGetSpotsQuery.getKey = (variables?: GetSpotsQueryVariables) => variables === undefined ? ['GetSpots'] : ['GetSpots', variables];
