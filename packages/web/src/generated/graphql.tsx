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

export type Follower = {
  __typename?: 'Follower';
  createdAt: Scalars['DateTime']['output'];
  follower: User;
  followerId: Scalars['String']['output'];
  following: User;
  followingId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
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

export const MediaTypeEnum = {
  Image: 'IMAGE',
  Video: 'VIDEO'
} as const;

export type MediaTypeEnum = typeof MediaTypeEnum[keyof typeof MediaTypeEnum];
export type Mutation = {
  __typename?: 'Mutation';
  bulkCreateSpotForecast: Array<SpotForecast>;
  createLocation: Location;
  createSpot: Spot;
  createSpotCheck: SpotCheck;
  createSpotCompetition: SpotCompetition;
  createSpotForecast: SpotForecast;
  followUser: Follower;
  login: AuthPayload;
  register: AuthPayload;
  unfollowUser: Scalars['Boolean']['output'];
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


export type MutationCreateSpotCheckArgs = {
  data: SpotCheckCreateInput;
};


export type MutationCreateSpotCompetitionArgs = {
  data: SpotCompetitionCreateInput;
};


export type MutationCreateSpotForecastArgs = {
  data: SpotForecastCreateInput;
};


export type MutationFollowUserArgs = {
  userId: Scalars['String']['input'];
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


export type MutationUnfollowUserArgs = {
  userId: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  boards: Array<Board>;
  devices: Array<Device>;
  followers: Array<Follower>;
  likes: Array<Like>;
  locations: Array<Location>;
  maneuverevents: Array<ManeuverEvent>;
  me?: Maybe<User>;
  myFriends: Array<User>;
  samples: Array<Sample>;
  sensors: Array<Sensor>;
  sessionmedias: Array<SessionMedia>;
  sessionratings: Array<SessionRating>;
  sessions: Array<Session>;
  sessionsensors: Array<SessionSensor>;
  spot?: Maybe<Spot>;
  spotChecksBySpot: Array<SpotCheck>;
  spotCompetitionsBySpot: Array<SpotCompetition>;
  spotForecastsBySpot: Array<SpotForecast>;
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


export type QueryFollowersArgs = {
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


export type QuerySpotArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySpotChecksBySpotArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  spotId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotCompetitionsBySpotArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  spotId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpotForecastsBySpotArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  spotId: Scalars['String']['input'];
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
  description?: Maybe<Scalars['String']['output']>;
  difficulty?: Maybe<Scalars['String']['output']>;
  forecasts: Array<SpotForecast>;
  id: Scalars['ID']['output'];
  idealSwellDir?: Maybe<Scalars['Float']['output']>;
  idealWindDir?: Maybe<Scalars['Float']['output']>;
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
  score: Scalars['Float']['output'];
  spot: Spot;
  spotId: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['String']['output'];
};

export type SpotCheckCreateInput = {
  description: Scalars['String']['input'];
  media?: InputMaybe<Array<SpotCheckMediaInput>>;
  score: Scalars['Float']['input'];
  spotId: Scalars['String']['input'];
  timestamp?: InputMaybe<Scalars['DateTime']['input']>;
};

export type SpotCheckMedia = {
  __typename?: 'SpotCheckMedia';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  mediaType: MediaTypeEnum;
  mediaUrl: Scalars['String']['output'];
  mimeType?: Maybe<Scalars['String']['output']>;
  spotCheck: SpotCheck;
  spotCheckId: Scalars['String']['output'];
};

export type SpotCheckMediaInput = {
  mediaType: MediaTypeEnum;
  mediaUrl: Scalars['String']['input'];
  mimeType?: InputMaybe<Scalars['String']['input']>;
};

export type SpotCompetition = {
  __typename?: 'SpotCompetition';
  createdAt: Scalars['DateTime']['output'];
  createdBy?: Maybe<User>;
  createdById?: Maybe<Scalars['String']['output']>;
  date: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  spot: Spot;
  spotId: Scalars['String']['output'];
};

export type SpotCompetitionCreateInput = {
  date: Scalars['DateTime']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  spotId: Scalars['String']['input'];
};

export type SpotCreateInput = {
  bottomType: BottomTypeEnum;
  country: CountryEnum;
  description?: InputMaybe<Scalars['String']['input']>;
  difficulty?: InputMaybe<Scalars['String']['input']>;
  idealSwellDir?: InputMaybe<Scalars['Float']['input']>;
  idealWindDir?: InputMaybe<Scalars['Float']['input']>;
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
  spotId?: Maybe<Scalars['String']['output']>;
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
  followers: Array<Follower>;
  following: Array<Follower>;
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


export type CreateSpotMutation = { __typename?: 'Mutation', createSpot: { __typename?: 'Spot', id: string, name: string, lat: number, lng: number, waveType: WaveTypeEnum, bottomType: BottomTypeEnum, country: CountryEnum, locationId: string, difficulty?: string | null, description?: string | null, idealWindDir?: number | null, idealSwellDir?: number | null, mapsUrl: string } };

export type CreateSpotCheckMutationVariables = Exact<{
  data: SpotCheckCreateInput;
}>;


export type CreateSpotCheckMutation = { __typename?: 'Mutation', createSpotCheck: { __typename?: 'SpotCheck', id: string, spotId: string, userId: string, description: string, score: number, timestamp: any, createdAt: any, media: Array<{ __typename?: 'SpotCheckMedia', id: string, mediaUrl: string, mediaType: MediaTypeEnum, mimeType?: string | null }> } };

export type CreateSpotCompetitionMutationVariables = Exact<{
  data: SpotCompetitionCreateInput;
}>;


export type CreateSpotCompetitionMutation = { __typename?: 'Mutation', createSpotCompetition: { __typename?: 'SpotCompetition', id: string, name: string, description?: string | null, date: any, spotId: string } };

export type FollowUserMutationVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type FollowUserMutation = { __typename?: 'Mutation', followUser: { __typename?: 'Follower', id: string, followingId: string } };

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

export type UnfollowUserMutationVariables = Exact<{
  userId: Scalars['String']['input'];
}>;


export type UnfollowUserMutation = { __typename?: 'Mutation', unfollowUser: boolean };

export type GetSpotQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetSpotQuery = { __typename?: 'Query', spot?: { __typename?: 'Spot', id: string, name: string, description?: string | null, lat: number, lng: number, waveType: WaveTypeEnum, bottomType: BottomTypeEnum, country: CountryEnum, locationId: string, difficulty?: string | null, idealWindDir?: number | null, idealSwellDir?: number | null, mapsUrl: string, createdAt: any } | null };

export type GetLocationsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetLocationsQuery = { __typename?: 'Query', locations: Array<{ __typename?: 'Location', id: string, name: string, country: CountryEnum, lat?: number | null, lng?: number | null }> };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, name: string, email: string, createdAt: any } | null };

export type MyFriendsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyFriendsQuery = { __typename?: 'Query', myFriends: Array<{ __typename?: 'User', id: string, name: string, email: string }> };

export type GetSpotChecksQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSpotChecksQuery = { __typename?: 'Query', spotchecks: Array<{ __typename?: 'SpotCheck', id: string, spotId: string, userId: string, description: string, score: number, timestamp: any, createdAt: any, media: Array<{ __typename?: 'SpotCheckMedia', id: string, mediaUrl: string, mediaType: MediaTypeEnum, mimeType?: string | null }> }> };

export type SpotChecksBySpotQueryVariables = Exact<{
  spotId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SpotChecksBySpotQuery = { __typename?: 'Query', spotChecksBySpot: Array<{ __typename?: 'SpotCheck', id: string, description: string, score: number, timestamp: any, userId: string, media: Array<{ __typename?: 'SpotCheckMedia', id: string, mediaUrl: string, mediaType: MediaTypeEnum }> }> };

export type SpotCompetitionsBySpotQueryVariables = Exact<{
  spotId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SpotCompetitionsBySpotQuery = { __typename?: 'Query', spotCompetitionsBySpot: Array<{ __typename?: 'SpotCompetition', id: string, name: string, description?: string | null, date: any, createdById?: string | null }> };

export type SpotForecastsBySpotQueryVariables = Exact<{
  spotId: Scalars['String']['input'];
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type SpotForecastsBySpotQuery = { __typename?: 'Query', spotForecastsBySpot: Array<{ __typename?: 'SpotForecast', id: string, ideal: boolean, score?: number | null, swell: number, swellDir: number, wind: number, windDir: number, period?: number | null, energy?: number | null, temp?: number | null, gust?: string | null, power?: string | null, timestamp?: any | null }> };

export type GetSpotsQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSpotsQuery = { __typename?: 'Query', spots: Array<{ __typename?: 'Spot', id: string, name: string, lat: number, lng: number, waveType: WaveTypeEnum, bottomType: BottomTypeEnum, country: CountryEnum, locationId: string, difficulty?: string | null, description?: string | null, idealWindDir?: number | null, idealSwellDir?: number | null, mapsUrl: string }> };

export type GetUsersQueryVariables = Exact<{
  take?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetUsersQuery = { __typename?: 'Query', users: Array<{ __typename?: 'User', id: string, name: string, email: string }> };



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
    description
    idealWindDir
    idealSwellDir
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

export const CreateSpotCheckDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation CreateSpotCheck($data: SpotCheckCreateInput!) {
  createSpotCheck(data: $data) {
    id
    spotId
    userId
    description
    score
    timestamp
    createdAt
    media {
      id
      mediaUrl
      mediaType
      mimeType
    }
  }
}
    `);

export const useCreateSpotCheckMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSpotCheckMutation, TError, CreateSpotCheckMutationVariables, TContext>) => {
    
    return useMutation<CreateSpotCheckMutation, TError, CreateSpotCheckMutationVariables, TContext>(
      {
    mutationKey: ['CreateSpotCheck'],
    mutationFn: (variables?: CreateSpotCheckMutationVariables) => fetcher<CreateSpotCheckMutation, CreateSpotCheckMutationVariables>(CreateSpotCheckDocument, variables)(),
    ...options
  }
    )};

useCreateSpotCheckMutation.getKey = () => ['CreateSpotCheck'];

export const CreateSpotCompetitionDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation CreateSpotCompetition($data: SpotCompetitionCreateInput!) {
  createSpotCompetition(data: $data) {
    id
    name
    description
    date
    spotId
  }
}
    `);

export const useCreateSpotCompetitionMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<CreateSpotCompetitionMutation, TError, CreateSpotCompetitionMutationVariables, TContext>) => {
    
    return useMutation<CreateSpotCompetitionMutation, TError, CreateSpotCompetitionMutationVariables, TContext>(
      {
    mutationKey: ['CreateSpotCompetition'],
    mutationFn: (variables?: CreateSpotCompetitionMutationVariables) => fetcher<CreateSpotCompetitionMutation, CreateSpotCompetitionMutationVariables>(CreateSpotCompetitionDocument, variables)(),
    ...options
  }
    )};

useCreateSpotCompetitionMutation.getKey = () => ['CreateSpotCompetition'];

export const FollowUserDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation FollowUser($userId: String!) {
  followUser(userId: $userId) {
    id
    followingId
  }
}
    `);

export const useFollowUserMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<FollowUserMutation, TError, FollowUserMutationVariables, TContext>) => {
    
    return useMutation<FollowUserMutation, TError, FollowUserMutationVariables, TContext>(
      {
    mutationKey: ['FollowUser'],
    mutationFn: (variables?: FollowUserMutationVariables) => fetcher<FollowUserMutation, FollowUserMutationVariables>(FollowUserDocument, variables)(),
    ...options
  }
    )};

useFollowUserMutation.getKey = () => ['FollowUser'];

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

export const UnfollowUserDocument = /*#__PURE__*/ new TypedDocumentString(`
    mutation UnfollowUser($userId: String!) {
  unfollowUser(userId: $userId)
}
    `);

export const useUnfollowUserMutation = <
      TError = unknown,
      TContext = unknown
    >(options?: UseMutationOptions<UnfollowUserMutation, TError, UnfollowUserMutationVariables, TContext>) => {
    
    return useMutation<UnfollowUserMutation, TError, UnfollowUserMutationVariables, TContext>(
      {
    mutationKey: ['UnfollowUser'],
    mutationFn: (variables?: UnfollowUserMutationVariables) => fetcher<UnfollowUserMutation, UnfollowUserMutationVariables>(UnfollowUserDocument, variables)(),
    ...options
  }
    )};

useUnfollowUserMutation.getKey = () => ['UnfollowUser'];

export const GetSpotDocument = /*#__PURE__*/ new TypedDocumentString(`
    query GetSpot($id: ID!) {
  spot(id: $id) {
    id
    name
    description
    lat
    lng
    waveType
    bottomType
    country
    locationId
    difficulty
    idealWindDir
    idealSwellDir
    mapsUrl
    createdAt
  }
}
    `);

export const useGetSpotQuery = <
      TData = GetSpotQuery,
      TError = unknown
    >(
      variables: GetSpotQueryVariables,
      options?: Omit<UseQueryOptions<GetSpotQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSpotQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSpotQuery, TError, TData>(
      {
    queryKey: ['GetSpot', variables],
    queryFn: fetcher<GetSpotQuery, GetSpotQueryVariables>(GetSpotDocument, variables),
    ...options
  }
    )};

useGetSpotQuery.getKey = (variables: GetSpotQueryVariables) => ['GetSpot', variables];

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

export const MyFriendsDocument = /*#__PURE__*/ new TypedDocumentString(`
    query MyFriends {
  myFriends {
    id
    name
    email
  }
}
    `);

export const useMyFriendsQuery = <
      TData = MyFriendsQuery,
      TError = unknown
    >(
      variables?: MyFriendsQueryVariables,
      options?: Omit<UseQueryOptions<MyFriendsQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<MyFriendsQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<MyFriendsQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['MyFriends'] : ['MyFriends', variables],
    queryFn: fetcher<MyFriendsQuery, MyFriendsQueryVariables>(MyFriendsDocument, variables),
    ...options
  }
    )};

useMyFriendsQuery.getKey = (variables?: MyFriendsQueryVariables) => variables === undefined ? ['MyFriends'] : ['MyFriends', variables];

export const GetSpotChecksDocument = /*#__PURE__*/ new TypedDocumentString(`
    query GetSpotChecks($take: Int, $skip: Int) {
  spotchecks(take: $take, skip: $skip) {
    id
    spotId
    userId
    description
    score
    timestamp
    createdAt
    media {
      id
      mediaUrl
      mediaType
      mimeType
    }
  }
}
    `);

export const useGetSpotChecksQuery = <
      TData = GetSpotChecksQuery,
      TError = unknown
    >(
      variables?: GetSpotChecksQueryVariables,
      options?: Omit<UseQueryOptions<GetSpotChecksQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetSpotChecksQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetSpotChecksQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetSpotChecks'] : ['GetSpotChecks', variables],
    queryFn: fetcher<GetSpotChecksQuery, GetSpotChecksQueryVariables>(GetSpotChecksDocument, variables),
    ...options
  }
    )};

useGetSpotChecksQuery.getKey = (variables?: GetSpotChecksQueryVariables) => variables === undefined ? ['GetSpotChecks'] : ['GetSpotChecks', variables];

export const SpotChecksBySpotDocument = /*#__PURE__*/ new TypedDocumentString(`
    query SpotChecksBySpot($spotId: String!, $take: Int, $skip: Int) {
  spotChecksBySpot(spotId: $spotId, take: $take, skip: $skip) {
    id
    description
    score
    timestamp
    userId
    media {
      id
      mediaUrl
      mediaType
    }
  }
}
    `);

export const useSpotChecksBySpotQuery = <
      TData = SpotChecksBySpotQuery,
      TError = unknown
    >(
      variables: SpotChecksBySpotQueryVariables,
      options?: Omit<UseQueryOptions<SpotChecksBySpotQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<SpotChecksBySpotQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<SpotChecksBySpotQuery, TError, TData>(
      {
    queryKey: ['SpotChecksBySpot', variables],
    queryFn: fetcher<SpotChecksBySpotQuery, SpotChecksBySpotQueryVariables>(SpotChecksBySpotDocument, variables),
    ...options
  }
    )};

useSpotChecksBySpotQuery.getKey = (variables: SpotChecksBySpotQueryVariables) => ['SpotChecksBySpot', variables];

export const SpotCompetitionsBySpotDocument = /*#__PURE__*/ new TypedDocumentString(`
    query SpotCompetitionsBySpot($spotId: String!, $take: Int, $skip: Int) {
  spotCompetitionsBySpot(spotId: $spotId, take: $take, skip: $skip) {
    id
    name
    description
    date
    createdById
  }
}
    `);

export const useSpotCompetitionsBySpotQuery = <
      TData = SpotCompetitionsBySpotQuery,
      TError = unknown
    >(
      variables: SpotCompetitionsBySpotQueryVariables,
      options?: Omit<UseQueryOptions<SpotCompetitionsBySpotQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<SpotCompetitionsBySpotQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<SpotCompetitionsBySpotQuery, TError, TData>(
      {
    queryKey: ['SpotCompetitionsBySpot', variables],
    queryFn: fetcher<SpotCompetitionsBySpotQuery, SpotCompetitionsBySpotQueryVariables>(SpotCompetitionsBySpotDocument, variables),
    ...options
  }
    )};

useSpotCompetitionsBySpotQuery.getKey = (variables: SpotCompetitionsBySpotQueryVariables) => ['SpotCompetitionsBySpot', variables];

export const SpotForecastsBySpotDocument = /*#__PURE__*/ new TypedDocumentString(`
    query SpotForecastsBySpot($spotId: String!, $take: Int, $skip: Int) {
  spotForecastsBySpot(spotId: $spotId, take: $take, skip: $skip) {
    id
    ideal
    score
    swell
    swellDir
    wind
    windDir
    period
    energy
    temp
    gust
    power
    timestamp
  }
}
    `);

export const useSpotForecastsBySpotQuery = <
      TData = SpotForecastsBySpotQuery,
      TError = unknown
    >(
      variables: SpotForecastsBySpotQueryVariables,
      options?: Omit<UseQueryOptions<SpotForecastsBySpotQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<SpotForecastsBySpotQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<SpotForecastsBySpotQuery, TError, TData>(
      {
    queryKey: ['SpotForecastsBySpot', variables],
    queryFn: fetcher<SpotForecastsBySpotQuery, SpotForecastsBySpotQueryVariables>(SpotForecastsBySpotDocument, variables),
    ...options
  }
    )};

useSpotForecastsBySpotQuery.getKey = (variables: SpotForecastsBySpotQueryVariables) => ['SpotForecastsBySpot', variables];

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
    description
    idealWindDir
    idealSwellDir
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

export const GetUsersDocument = /*#__PURE__*/ new TypedDocumentString(`
    query GetUsers($take: Int, $skip: Int, $name: String) {
  users(take: $take, skip: $skip, name: $name) {
    id
    name
    email
  }
}
    `);

export const useGetUsersQuery = <
      TData = GetUsersQuery,
      TError = unknown
    >(
      variables?: GetUsersQueryVariables,
      options?: Omit<UseQueryOptions<GetUsersQuery, TError, TData>, 'queryKey'> & { queryKey?: UseQueryOptions<GetUsersQuery, TError, TData>['queryKey'] }
    ) => {
    
    return useQuery<GetUsersQuery, TError, TData>(
      {
    queryKey: variables === undefined ? ['GetUsers'] : ['GetUsers', variables],
    queryFn: fetcher<GetUsersQuery, GetUsersQueryVariables>(GetUsersDocument, variables),
    ...options
  }
    )};

useGetUsersQuery.getKey = (variables?: GetUsersQueryVariables) => variables === undefined ? ['GetUsers'] : ['GetUsers', variables];
