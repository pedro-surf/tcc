import { GraphQLError } from 'graphql'
import { HeatStatus } from '@prisma/client'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { CompetitionHeatRef } from '../objects/CompetitionHeat'
import { HeatWaveRef } from '../objects/HeatWave'

const HEAT_DURATIONS = new Set([15, 30, 40])

const CompetitionHeatCreateInput = builder.inputType(
  'CompetitionHeatCreateInput',
  {
    fields: (t) => ({
      competitionId: t.string({ required: true }),
      name: t.string({ required: true }),
      judgeCount: t.int({ required: true }),
      durationMin: t.int({ required: true }),
      surferIds: t.field({ type: ['String'], required: true }),
    }),
  },
)

function requireJudgeCount(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new GraphQLError('Judge count must be between 1 and 5')
  }
}

function requireDuration(value: number) {
  if (!HEAT_DURATIONS.has(value)) {
    throw new GraphQLError('Heat duration must be 15, 30, or 40 minutes')
  }
}

function requireScore(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 10) {
    throw new GraphQLError('Score must be between 0 and 10')
  }
}

builder.mutationField('createCompetitionHeat', (t) =>
  t.prismaField({
    type: CompetitionHeatRef,
    args: {
      data: t.arg({ type: CompetitionHeatCreateInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      const name = args.data.name.trim()
      if (!name) throw new GraphQLError('Name is required')

      requireJudgeCount(args.data.judgeCount)
      requireDuration(args.data.durationMin)

      const surferIds = [...new Set(args.data.surferIds.map((id) => id.trim()).filter(Boolean))]
      if (surferIds.length === 0) {
        throw new GraphQLError('Add at least one surfer')
      }

      const competition = await prisma.spotCompetition.findUnique({
        where: { id: args.data.competitionId },
        select: { id: true },
      })
      if (!competition) throw new GraphQLError('Event not found')

      const users = await prisma.user.findMany({
        where: { id: { in: surferIds } },
        select: { id: true },
      })
      if (users.length !== surferIds.length) {
        throw new GraphQLError('One or more surfers were not found')
      }

      return prisma.competitionHeat.create({
        ...query,
        data: {
          competitionId: args.data.competitionId,
          name,
          judgeCount: args.data.judgeCount,
          durationMin: args.data.durationMin,
          surfers: {
            create: surferIds.map((userId) => ({ userId })),
          },
        },
      })
    },
  }),
)

builder.mutationField('startHeat', (t) =>
  t.prismaField({
    type: CompetitionHeatRef,
    args: {
      heatId: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      const heat = await prisma.competitionHeat.findUnique({
        where: { id: String(args.heatId) },
      })
      if (!heat) throw new GraphQLError('Heat not found')
      if (heat.status === HeatStatus.FINISHED) {
        throw new GraphQLError('Heat already finished')
      }
      if (heat.status === HeatStatus.RUNNING && heat.startedAt) {
        return prisma.competitionHeat.findUniqueOrThrow({
          ...query,
          where: { id: heat.id },
        })
      }

      return prisma.competitionHeat.update({
        ...query,
        where: { id: heat.id },
        data: {
          status: HeatStatus.RUNNING,
          startedAt: new Date(),
          endedAt: null,
        },
      })
    },
  }),
)

builder.mutationField('endHeat', (t) =>
  t.prismaField({
    type: CompetitionHeatRef,
    args: {
      heatId: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      const heat = await prisma.competitionHeat.findUnique({
        where: { id: String(args.heatId) },
      })
      if (!heat) throw new GraphQLError('Heat not found')
      if (heat.status === HeatStatus.PENDING) {
        throw new GraphQLError('Heat has not started')
      }
      if (heat.status === HeatStatus.FINISHED) {
        return prisma.competitionHeat.findUniqueOrThrow({
          ...query,
          where: { id: heat.id },
        })
      }

      return prisma.competitionHeat.update({
        ...query,
        where: { id: heat.id },
        data: {
          status: HeatStatus.FINISHED,
          endedAt: new Date(),
        },
      })
    },
  }),
)

builder.mutationField('markHeatWave', (t) =>
  t.prismaField({
    type: HeatWaveRef,
    args: {
      heatId: t.arg.id({ required: true }),
      surferId: t.arg.id({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      const heat = await prisma.competitionHeat.findUnique({
        where: { id: String(args.heatId) },
      })
      if (!heat) throw new GraphQLError('Heat not found')
      if (heat.status !== HeatStatus.RUNNING || !heat.startedAt) {
        throw new GraphQLError('Start the heat before marking waves')
      }

      const surfer = await prisma.heatSurfer.findFirst({
        where: {
          id: String(args.surferId),
          heatId: heat.id,
        },
      })
      if (!surfer) throw new GraphQLError('Surfer is not in this heat')

      const elapsedSec = Math.max(
        0,
        Math.min(
          heat.durationMin * 60,
          Math.floor((Date.now() - heat.startedAt.getTime()) / 1000),
        ),
      )

      return prisma.heatWave.create({
        ...query,
        data: {
          heatId: heat.id,
          surferId: surfer.id,
          elapsedSec,
        },
      })
    },
  }),
)

builder.mutationField('scoreHeatWave', (t) =>
  t.prismaField({
    type: HeatWaveRef,
    args: {
      waveId: t.arg.id({ required: true }),
      judgeIndex: t.arg.int({ required: true }),
      score: t.arg.float({ required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      requireUser(ctx)
      requireScore(args.score)

      const wave = await prisma.heatWave.findUnique({
        where: { id: String(args.waveId) },
        include: { heat: true },
      })
      if (!wave) throw new GraphQLError('Wave not found')

      if (
        !Number.isInteger(args.judgeIndex) ||
        args.judgeIndex < 1 ||
        args.judgeIndex > wave.heat.judgeCount
      ) {
        throw new GraphQLError(
          `Judge index must be between 1 and ${wave.heat.judgeCount}`,
        )
      }

      await prisma.heatWaveScore.upsert({
        where: {
          waveId_judgeIndex: {
            waveId: wave.id,
            judgeIndex: args.judgeIndex,
          },
        },
        create: {
          waveId: wave.id,
          judgeIndex: args.judgeIndex,
          score: args.score,
        },
        update: {
          score: args.score,
        },
      })

      return prisma.heatWave.findUniqueOrThrow({
        ...query,
        where: { id: wave.id },
      })
    },
  }),
)
