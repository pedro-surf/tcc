import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query';
import { fetcher } from '../graphql/fetcher';
export class TypedDocumentString<TResult, TVariables> extends String {
  __apiType?: NonNullable<TResult>;
  __variablesType?: NonNullable<TVariables>;
  __meta__?: Record<string, unknown>;
  private readonly __value: string;
  constructor(value: string, __meta__?: Record<string, unknown>) {
    super(value);
    this.__value = value;
    this.__meta__ = __meta__;
  }
  toString(): string {
    return this.__value;
  }
}

export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  Json: { input: any; output: any; }
};

export type AuthPayload = {
  __typename?: 'AuthPayload';
  token: Scalars['String']['output'];
  user: User;
};

export type Board = {
  __typename?: 'Board';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  length: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  sessions: Array<Session>;
  thickness: Scalars['Float']['output'];
  volume?: Maybe<Scalars['Float']['output']>;
  width: Scalars['Float']['output'];
};

export const BottomTypeEnum = {
  Reef: 'REEF',
  Rock: 'ROCK',
  Sand: 'SAND'
} as const;

export type BottomTypeEnum = typeof BottomTypeEnum[keyof typeof BottomTypeEnum];
export const CountryEnum = {
  Australia: 'AUSTRALIA',
  Brazil: 'BRAZIL',
  Chile: 'CHILE',
  Peru: 'PERU',
  Portugal: 'PORTUGAL'
} as const;

export type CountryEnum = typeof CountryEnum[keyof typeof CountryEnum];
export type Device = {
  __typename?: 'Device';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<Scalars['String']['output']>;
  creator?: Maybe<User>;
  id: Scalars['ID']['output'];
  type: Scalars['String']['output'];
};

export type Like = {
  __typename?: 'Like';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  session: Session;
  sessionId: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type Location = {
  __typename?: 'Location';
  country: CountryEnum;
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lng?: Maybe<Scalars['Float']['output']>;
  mapsUrl?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  spots: Array<Spot>;
};

export type LocationCreateInput = {
  country: CountryEnum;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  name: Scalars['String']['input'];
};

export type ManeuverEvent = {
  __typename?: 'ManeuverEvent';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  score: Scalars['Float']['output'];
  session: Session;
  sessionId: Scalars['String']['output'];
  timestamp: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  bulkCreateSpotForecast: Array<SpotForecast>;
  createLocation: Location;
  createSpot: Spot;
  createSpotForecast: SpotForecast;
  login: AuthPayload;
  register: AuthPayload;
};


export type MutationBulkCreateSpotForecastArgs = {
  data: Array<SpotForecastCreateInput>;
};


export type MutationCreateLocationArgs = {
  data: LocationCreateInput;
};


export type MutationCreateSpotArgs = {
  data: SpotCreateInput;
};


export type MutationCreateSpotForecastArgs = {
  data: SpotForecastCreateInput;
};


export type MutationLoginArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRegisterArgs = {
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  boards: Array<Board>;
  devices: Array<Device>;
  likes: Array<Like>;
  locations: Array<Location>;
  maneuverevents: Array<ManeuverEvent>;
  me?: Maybe<User>;
  samples: Array<Sample>;
  sensors: Array<Sensor>;
  sessionmedias: Array<SessionMedia>;
  sessionratings: Array<SessionRating>;
  sessions: Array<Session>;
  sessionsensors: Array<SessionSensor>;
  spotaccesss: Array<SpotAccess>;
  spotcheckmedias: Array<SpotCheckMedia>;
  spotchecks: Array<SpotCheck>;
  spotcompetitions: Array<SpotCompetition>;
  spotdatas: Array<SpotData>;
  spotforecasts: Array<SpotForecast>;
  spots: Array<Spot>;
  users: Array<User>;
  wetsuits: Array<Wetsuit>;
};


export type QueryBoardsArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDevicesArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLikesArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLocationsArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryManeuvereventsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySamplesArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySensorsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySessionmediasArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySessionratingsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySessionsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySessionsensorsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotaccesssArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotcheckmediasArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotchecksArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotcompetitionsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotdatasArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotforecastsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotsArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUsersArgs = {
  name?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWetsuitsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  take?: InputMaybe<Scalars['Int']['input']>;
};

export type Sample = {
  __typename?: 'Sample';
  alt?: Maybe<Scalars['Float']['output']>;
  ax: Scalars['Float']['output'];
  ay: Scalars['Float']['output'];
  az: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  fix?: Maybe<Scalars['Int']['output']>;
  gx: Scalars['Float']['output'];
  gy: Scalars['Float']['output'];
  gz: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  lat?: Maybe<Scalars['Float']['output']>;
  lon?: Maybe<Scalars['Float']['output']>;
  sat?: Maybe<Scalars['Int']['output']>;
  session: Session;
  sessionId: Scalars['String']['output'];
  timestamp: Scalars['Float']['output'];
};

export type Sensor = {
  __typename?: 'Sensor';
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  id: Scalars['ID']['output'];
  recordedAt: Scalars['DateTime']['output'];
  sessionSensors: Array<SessionSensor>;
  type: Scalars['String']['output'];
};

export type Session = {
  __typename?: 'Session';
  avgWave?: Maybe<Scalars['Float']['output']>;
  board?: Maybe<Board>;
  boardId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  durationMin: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  likes: Array<Like>;
  manuevers: Array<ManeuverEvent>;
  maxWave?: Maybe<Scalars['Float']['output']>;
  notes?: Maybe<Scalars['String']['output']>;
  samples: Array<Sample>;
  sessionMedia: Array<SessionMedia>;
  sessionRatings: Array<SessionRating>;
  sessionSensors: Array<SessionSensor>;
  spot: Spot;
  spotId: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
  waveCount?: Maybe<Scalars['Int']['output']>;
  wetsuit?: Maybe<Wetsuit>;
  wetsuitId?: Maybe<Scalars['String']['output']>;
};

export type SessionMedia = {
  __typename?: 'SessionMedia';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaUrl: Scalars['String']['output'];
  session: Session;
  sessionId: Scalars['String']['output'];
};

export type SessionRating = {
  __typename?: 'SessionRating';
  comments?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creator: User;
  creatorId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  rating: Scalars['Int']['output'];
  session: Session;
  sessionId: Scalars['String']['output'];
  surfed: Scalars['Boolean']['output'];
};

export type SessionSensor = {
  __typename?: 'SessionSensor';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  sensor: Sensor;
  sensorId: Scalars['String']['output'];
  session: Session;
  sessionId: Scalars['String']['output'];
};

export type Spot = {
  __typename?: 'Spot';
  accesses: Array<SpotAccess>;
  bottomType: BottomTypeEnum;
  checks: Array<SpotCheck>;
  competitions: Array<SpotCompetition>;
  country: CountryEnum;
  createdAt: Scalars['DateTime']['output'];
  data: Array<SpotData>;
  difficulty?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
  locationId: Scalars['String']['output'];
  mapsUrl: Scalars['String']['output'];
  name: Scalars['String']['output'];
  secret?: Maybe<Scalars['Boolean']['output']>;
  sessions: Array<Session>;
  waveType: WaveTypeEnum;
};

export type SpotAccess = {
  __typename?: 'SpotAccess';
  accessType: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  spot: Spot;
  spotId: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type SpotCheck = {
  __typename?: 'SpotCheck';
  createdAt: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  media: Array<SpotCheckMedia>;
  spot: Spot;
  spotId: Scalars['String']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type SpotCheckMedia = {
  __typename?: 'SpotCheckMedia';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaUrl: Scalars['String']['output'];
  spotCheck: SpotCheck;
  spotCheckId: Scalars['String']['output'];
};

export type SpotCompetition = {
  __typename?: 'SpotCompetition';
  createdAt: Scalars['DateTime']['output'];
  date: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  spot: Spot;
  spotId: Scalars['String']['output'];
};

export type SpotCreateInput = {
  bottomType: BottomTypeEnum;
  country: CountryEnum;
  difficulty?: InputMaybe<Scalars['String']['input']>;
  lat?: InputMaybe<Scalars['Float']['input']>;
  lng?: InputMaybe<Scalars['Float']['input']>;
  locationId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  waveType: WaveTypeEnum;
};

export type SpotData = {
  __typename?: 'SpotData';
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  id: Scalars['ID']['output'];
  spot: Spot;
  spotId: Scalars['String']['output'];
};

export type SpotForecast = {
  __typename?: 'SpotForecast';
  createdAt: Scalars['DateTime']['output'];
  energy?: Maybe<Scalars['Float']['output']>;
  gust?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  ideal: Scalars['Boolean']['output'];
  location?: Maybe<Location>;
  period?: Maybe<Scalars['Float']['output']>;
  power?: Maybe<Scalars['String']['output']>;
  score?: Maybe<Scalars['Float']['output']>;
  spot?: Maybe<Spot>;
  spotId: Scalars['String']['output'];
  swell: Scalars['Float']['output'];
  swellDir: Scalars['Float']['output'];
  temp?: Maybe<Scalars['Float']['output']>;
  timestamp?: Maybe<Scalars['DateTime']['output']>;
  user: User;
  userId: Scalars['String']['output'];
  wind: Scalars['Float']['output'];
  windDir: Scalars['Float']['output'];
};

export type SpotForecastCreateInput = {
  energy?: InputMaybe<Scalars['Float']['input']>;
  gust?: InputMaybe<Scalars['String']['input']>;
  ideal: Scalars['Boolean']['input'];
  period?: InputMaybe<Scalars['Float']['input']>;
  power?: InputMaybe<Scalars['String']['input']>;
  score?: InputMaybe<Scalars['Float']['input']>;
  spotId: Scalars['String']['input'];
  swell: Scalars['Float']['input'];
  swellDir: Scalars['Float']['input'];
  temp?: InputMaybe<Scalars['Float']['input']>;
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
  userId: Scalars['String']['input'];
  wind: Scalars['Float']['input'];
  windDir: Scalars['Float']['input'];
};

export type User = {
  __typename?: 'User';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export const WaveTypeEnum = {
  AFrame: 'A_FRAME',
  Beachie: 'BEACHIE',
  LeftPoint: 'LEFT_POINT',
  RightPoint: 'RIGHT_POINT',
  Slab: 'SLAB'
} as const;

export type WaveTypeEnum = typeof WaveTypeEnum[keyof typeof WaveTypeEnum];
export type Wetsuit = {
  __typename?: 'Wetsuit';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  sessions: Array<Session>;
  thickness: Scalars['Float']['output'];
};

export type BulkCreateSpotForecastMutationVariables = Exact<{
  data: Array<SpotForecastCreateInput> | SpotForecastCreateInput;
}>;


export type BulkCreateSpotForecastMutation = { __typename?: 'Mutation', bulkCreateSpotForecast: Array<{ __typename?: 'SpotForecast', id: string, ideal: boolean }> };

export type CreateSpotMutationVariables = Exact<{
  data: SpotCreateInput;
}>;


export type CreateSpotMutation = { __typename?: 'Mutation', createSpot: { __typename?: 'Spot', id: string, name: string, lat: number, lng: number, waveType: WaveTypeEnum, bottomType: BottomTypeEnum, country: CountryEnum, locationId: string, difficulty?: string | null, mapsUrl: string } };

export type LoginMutationVariables = Exact<{
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, name: string, email: string, createdAt: any } } };

export type RegisterMutationVariables = Exact<{
  name: Scalars['String']['input'];
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'AuthPayload', token: string, user: { __typename?: 'User', id: string, name: string, email: string, createdAt: any } } };

export type GetLocationsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetLocationsQuery = { __typename?: 'Query', locations: Array<{ __typename?: 'Location', id: string, name: string, country: CountryEnum, lat?: number | null, lng?: number | null }> };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, name: string, email: string, createdAt: any } | null };

export type GetSpotsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSpotsQuery = { __typename?: 'Query', spots: Array<{ __typename?: 'Spot', id: string, name: string, lat: number, lng: number, waveType: WaveTypeEnum, bottomType: BottomTypeEnum, country: CountryEnum, locationId: string, difficulty?: string | null, mapsUrl: string }> };



export const BulkCreateSpotForecastDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation BulkCreateSpotForecast($data: [SpotForecastCreateInput!]!) {
  bulkCreateSpotForecast(data: $data) {
    id
    ideal
  }
}
    `);

export const useBulkCreateSpotForecastMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<BulkCreateSpotForecastMutation, TError, BulkCreateSpotForecastMutationVariables, TContext>) => {
    
    return useMutation<BulkCreateSpotForecastMutation, TError, BulkCreateSpotForecastMutationVariables, TContext>(
      {
    mutationKey: ['BulkCreateSpotForecast'],
    mutationFn: (variables?: BulkCreateSpotForecastMutationVariables) => fetcher<BulkCreateSpotForecastMutation, BulkCreateSpotForecastMutationVariables>(BulkCreateSpotForecastDocument, variables)(),
    ...options
  }
    )};

useBulkCreateSpotForecastMutation.getKey = () => ['BulkCreateSpotForecast'];

export const CreateSpotDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation CreateSpot($data: SpotCreateInput!) {
  createSpot(data: $data) {
    id
    name
    lat
    lng
    waveType
    bottomType
    country
    locationId
    difficulty
    mapsUrl
  }
}
    `);

export const useCreateSpotMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSpotMutation, TError, CreateSpotMutationVariables, TContext>) => {
    
    return useMutation<CreateSpotMutation, TError, CreateSpotMutationVariables, TContext>(
      {
    mutationKey: ['CreateSpot'],
    mutationFn: (variables?: CreateSpotMutationVariables) => fetcher<CreateSpotMutation, CreateSpotMutationVariables>(CreateSpotDocument, variables)(),
    ...options
  }
    )};

useCreateSpotMutation.getKey = () => ['CreateSpot'];

export const LoginDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      name
      email
      createdAt
    }
  }
}
    `);

export const useLoginMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<LoginMutation, TError, LoginMutationVariables, TContext>) => {
    
    return useMutation<LoginMutation, TError, LoginMutationVariables, TContext>(
      {
    mutationKey: ['Login'],
    mutationFn: (variables?: LoginMutationVariables) => fetcher<LoginMutation, LoginMutationVariables>(LoginDocument, variables)(),
    ...options
  }
    )};

useLoginMutation.getKey = () => ['Login'];

export const RegisterDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation Register($name: String!, $email: String!, $password: String!) {
  register(name: $name, email: $email, password: $password) {
    token
    user {
      id
      name
      email
      createdAt
    }
  }
}
    `);

export const useRegisterMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<RegisterMutation, TError, RegisterMutationVariables, TContext>) => {
    
    return useMutation<RegisterMutation, TError, RegisterMutationVariables, TContext>(
      {
    mutationKey: ['Register'],
    mutationFn: (variables?: RegisterMutationVariables) => fetcher<RegisterMutation, RegisterMutationVariables>(RegisterDocument, variables)(),
    ...options
  }
    )};

useRegisterMutation.getKey = () => ['Register'];

export const GetLocationsDocument = /*#__PURE__*/ new TypedDocumentString(`
    query GetLocations($take: Int, $skip: Int, $name: String) {
  locations(take: $take, skip: $skip, name: $name) {
    id
    name
    country
    lat
    lng
  }
}
    `);

export const useGetLocationsQuery = <
      TData = GetLocationsQuery,
      TError = unknown
    >(
      variables?: GetLocationsQueryVariables,
      options?: Omit<UseQueryOptions<GetLocationsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetLocationsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetLocationsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetLocations'] : ['GetLocations', variables],
    queryFn: fetcher<GetLocationsQuery, GetLocationsQueryVariables>(GetLocationsDocument, variables),
    ...options
  }
    )};

useGetLocationsQuery.getKey = (variables?: GetLocationsQueryVariables) => variables === undefined ? ['GetLocations'] : ['GetLocations', variables];

export const MeDocument = /*#__PURE__*/ new TypedDocumentString(`
    query Me {
  me {
    id
    name
    email
    createdAt
  }
}
    `);

export const useMeQuery = <
      TData = MeQuery,
      TError = unknown
    >(
      variables?: MeQueryVariables,
      options?: Omit<UseQueryOptions<MeQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MeQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<MeQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['Me'] : ['Me', variables],
    queryFn: fetcher<MeQuery, MeQueryVariables>(MeDocument, variables),
    ...options
  }
    )};

useMeQuery.getKey = (variables?: MeQueryVariables) => variables === undefined ? ['Me'] : ['Me', variables];

export const GetSpotsDocument = /*#__PURE__*/ new TypedDocumentString(`
    query GetSpots($take: Int, $skip: Int, $name: String) {
  spots(take: $take, skip: $skip, name: $name) {
    id
    name
    lat
    lng
    waveType
    bottomType
    country
    locationId
    difficulty
    mapsUrl
  }
}
    `);

export const useGetSpotsQuery = <
      TData = GetSpotsQuery,
      TError = unknown
    >(
      variables?: GetSpotsQueryVariables,
      options?: Omit<UseQueryOptions<GetSpotsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSpotsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSpotsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetSpots'] : ['GetSpots', variables],
    queryFn: fetcher<GetSpotsQuery, GetSpotsQueryVariables>(GetSpotsDocument, variables),
    ...options
  }
    )};

useGetSpotsQuery.getKey = (variables?: GetSpotsQueryVariables) => variables === undefined ? ['GetSpots'] : ['GetSpots', variables];
