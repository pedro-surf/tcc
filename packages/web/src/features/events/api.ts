import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import { fetcher } from '../../graphql/fetcher'

export const HeatStatusEnum = {
  Pending: 'PENDING',
  Running: 'RUNNING',
  Finished: 'FINISHED',
} as const

export type HeatStatusEnum =
  (typeof HeatStatusEnum)[keyof typeof HeatStatusEnum]

export type HeatUser = {
  id: string
  name: string
  email?: string | null
}

export type HeatWaveScore = {
  id: string
  judgeIndex: number
  score: number
}

export type HeatWave = {
  id: string
  heatId: string
  surferId: string
  elapsedSec: number
  averageScore?: number | null
  scoredCount: number
  surfer: {
    id: string
    user: HeatUser
  }
  scores: HeatWaveScore[]
}

export type HeatSurfer = {
  id: string
  userId: string
  heatTotal: number
  user: HeatUser
  waves: Array<{
    id: string
    elapsedSec: number
    averageScore?: number | null
    scoredCount: number
  }>
}

export type CompetitionHeat = {
  id: string
  competitionId: string
  name: string
  judgeCount: number
  durationMin: number
  status: HeatStatusEnum
  startedAt?: string | null
  endedAt?: string | null
  remainingSec: number
  createdAt: string
  competition: {
    id: string
    name: string
    date: string
    spotId: string
    spot: { id: string; name: string }
  }
  surfers: HeatSurfer[]
  waves: HeatWave[]
}

export type SpotCompetitionEvent = {
  id: string
  name: string
  description?: string | null
  date: string
  spotId: string
  createdById?: string | null
  spot: { id: string; name: string }
  heats: Array<{
    id: string
    name: string
    judgeCount: number
    durationMin: number
    status: HeatStatusEnum
    startedAt?: string | null
    remainingSec: number
    surfers: Array<{
      id: string
      heatTotal: number
      user: HeatUser
    }>
  }>
}

const HEAT_FIELDS = `
  id
  competitionId
  name
  judgeCount
  durationMin
  status
  startedAt
  endedAt
  remainingSec
  createdAt
  competition {
    id
    name
    date
    spotId
    spot { id name }
  }
  surfers {
    id
    userId
    heatTotal
    user { id name email }
    waves {
      id
      elapsedSec
      averageScore
      scoredCount
    }
  }
  waves {
    id
    heatId
    surferId
    elapsedSec
    averageScore
    scoredCount
    surfer {
      id
      user { id name }
    }
    scores {
      id
      judgeIndex
      score
    }
  }
`

const EVENT_FIELDS = `
  id
  name
  description
  date
  spotId
  createdById
  spot { id name }
  heats {
    id
    name
    judgeCount
    durationMin
    status
    startedAt
    remainingSec
    surfers {
      id
      heatTotal
      user { id name }
    }
  }
`

export const EventsDocument = `
  query Events($take: Int, $skip: Int) {
    events(take: $take, skip: $skip) {
      ${EVENT_FIELDS}
    }
  }
`

export const SpotCompetitionDocument = `
  query SpotCompetition($id: ID!) {
    spotCompetition(id: $id) {
      ${EVENT_FIELDS}
    }
  }
`

export const HeatDocument = `
  query Heat($id: ID!) {
    heat(id: $id) {
      ${HEAT_FIELDS}
    }
  }
`

export const CreateCompetitionHeatDocument = `
  mutation CreateCompetitionHeat($data: CompetitionHeatCreateInput!) {
    createCompetitionHeat(data: $data) {
      ${HEAT_FIELDS}
    }
  }
`

export const StartHeatDocument = `
  mutation StartHeat($heatId: ID!) {
    startHeat(heatId: $heatId) {
      ${HEAT_FIELDS}
    }
  }
`

export const EndHeatDocument = `
  mutation EndHeat($heatId: ID!) {
    endHeat(heatId: $heatId) {
      ${HEAT_FIELDS}
    }
  }
`

export const MarkHeatWaveDocument = `
  mutation MarkHeatWave($heatId: ID!, $surferId: ID!) {
    markHeatWave(heatId: $heatId, surferId: $surferId) {
      id
      heatId
      surferId
      elapsedSec
      averageScore
      scoredCount
      surfer {
        id
        user { id name }
      }
      scores {
        id
        judgeIndex
        score
      }
    }
  }
`

export const ScoreHeatWaveDocument = `
  mutation ScoreHeatWave($waveId: ID!, $judgeIndex: Int!, $score: Float!) {
    scoreHeatWave(waveId: $waveId, judgeIndex: $judgeIndex, score: $score) {
      id
      averageScore
      scoredCount
      scores {
        id
        judgeIndex
        score
      }
    }
  }
`

type EventsQuery = { events: SpotCompetitionEvent[] }
type EventsQueryVariables = { take?: number; skip?: number }

type SpotCompetitionQuery = { spotCompetition?: SpotCompetitionEvent | null }
type SpotCompetitionQueryVariables = { id: string }

type HeatQuery = { heat?: CompetitionHeat | null }
type HeatQueryVariables = { id: string }

type CreateCompetitionHeatMutation = {
  createCompetitionHeat: CompetitionHeat
}
export type CreateCompetitionHeatMutationVariables = {
  data: {
    competitionId: string
    name: string
    judgeCount: number
    durationMin: number
    surferIds: string[]
  }
}

type StartHeatMutation = { startHeat: CompetitionHeat }
type HeatIdVariables = { heatId: string }

type EndHeatMutation = { endHeat: CompetitionHeat }

type MarkHeatWaveMutation = { markHeatWave: HeatWave }
export type MarkHeatWaveMutationVariables = {
  heatId: string
  surferId: string
}

type ScoreHeatWaveMutation = {
  scoreHeatWave: Pick<HeatWave, 'id' | 'averageScore' | 'scoredCount' | 'scores'>
}
export type ScoreHeatWaveMutationVariables = {
  waveId: string
  judgeIndex: number
  score: number
}

export function useEventsQuery(
  variables?: EventsQueryVariables,
  options?: Omit<UseQueryOptions<EventsQuery>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ['Events', variables],
    queryFn: fetcher<EventsQuery, EventsQueryVariables>(
      EventsDocument,
      variables,
    ),
    ...options,
  })
}

export function useSpotCompetitionQuery(
  variables: SpotCompetitionQueryVariables,
  options?: Omit<UseQueryOptions<SpotCompetitionQuery>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ['SpotCompetition', variables],
    queryFn: fetcher<SpotCompetitionQuery, SpotCompetitionQueryVariables>(
      SpotCompetitionDocument,
      variables,
    ),
    ...options,
  })
}

export function useHeatQuery(
  variables: HeatQueryVariables,
  options?: Omit<UseQueryOptions<HeatQuery>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: ['Heat', variables],
    queryFn: fetcher<HeatQuery, HeatQueryVariables>(HeatDocument, variables),
    ...options,
  })
}

export function useCreateCompetitionHeatMutation(
  options?: UseMutationOptions<
    CreateCompetitionHeatMutation,
    Error,
    CreateCompetitionHeatMutationVariables
  >,
) {
  return useMutation({
    mutationKey: ['CreateCompetitionHeat'],
    mutationFn: (variables: CreateCompetitionHeatMutationVariables) =>
      fetcher<
        CreateCompetitionHeatMutation,
        CreateCompetitionHeatMutationVariables
      >(CreateCompetitionHeatDocument, variables)(),
    ...options,
  })
}

export function useStartHeatMutation(
  options?: UseMutationOptions<StartHeatMutation, Error, HeatIdVariables>,
) {
  return useMutation({
    mutationKey: ['StartHeat'],
    mutationFn: (variables: HeatIdVariables) =>
      fetcher<StartHeatMutation, HeatIdVariables>(
        StartHeatDocument,
        variables,
      )(),
    ...options,
  })
}

export function useEndHeatMutation(
  options?: UseMutationOptions<EndHeatMutation, Error, HeatIdVariables>,
) {
  return useMutation({
    mutationKey: ['EndHeat'],
    mutationFn: (variables: HeatIdVariables) =>
      fetcher<EndHeatMutation, HeatIdVariables>(EndHeatDocument, variables)(),
    ...options,
  })
}

export function useMarkHeatWaveMutation(
  options?: UseMutationOptions<
    MarkHeatWaveMutation,
    Error,
    MarkHeatWaveMutationVariables
  >,
) {
  return useMutation({
    mutationKey: ['MarkHeatWave'],
    mutationFn: (variables: MarkHeatWaveMutationVariables) =>
      fetcher<MarkHeatWaveMutation, MarkHeatWaveMutationVariables>(
        MarkHeatWaveDocument,
        variables,
      )(),
    ...options,
  })
}

export function useScoreHeatWaveMutation(
  options?: UseMutationOptions<
    ScoreHeatWaveMutation,
    Error,
    ScoreHeatWaveMutationVariables
  >,
) {
  return useMutation({
    mutationKey: ['ScoreHeatWave'],
    mutationFn: (variables: ScoreHeatWaveMutationVariables) =>
      fetcher<ScoreHeatWaveMutation, ScoreHeatWaveMutationVariables>(
        ScoreHeatWaveDocument,
        variables,
      )(),
    ...options,
  })
}
