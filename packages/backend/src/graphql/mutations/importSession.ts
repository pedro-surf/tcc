import { GraphQLError } from 'graphql'
import { builder, prisma } from '../builder'
import { requireUser, type Context } from '../context'
import { SessionRef } from '../objects/Session'

const ImportedSampleInput = builder.inputType('ImportedSampleInput', {
  fields: (t) => ({
    timestamp: t.float({ required: true }),
    ax: t.float({ required: true }),
    ay: t.float({ required: true }),
    az: t.float({ required: true }),
    gx: t.float({ required: true }),
    gy: t.float({ required: true }),
    gz: t.float({ required: true }),
    mx: t.float(),
    my: t.float(),
    mz: t.float(),
    roll: t.float(),
    pitch: t.float(),
    yaw: t.float(),
    pressure: t.float(),
    temperature: t.float(),
    lat: t.float(),
    lon: t.float(),
    fix: t.int(),
    alt: t.float(),
    sat: t.int(),
  }),
})

const ImportedManeuverInput = builder.inputType('ImportedManeuverInput', {
  fields: (t) => ({
    timestamp: t.float({ required: true }),
    type: t.string({ required: true }),
    score: t.float({ required: true }),
  }),
})

const ImportSessionInput = builder.inputType('ImportSessionInput', {
  fields: (t) => ({
    notes: t.string(),
    date: t.string({ required: true }),
    samples: t.field({ type: [ImportedSampleInput], required: true }),
    maneuvers: t.field({ type: [ImportedManeuverInput] }),
  }),
})

function optionalNumber(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

builder.mutationField('importSession', (t) =>
  t.prismaField({
    type: SessionRef,
    args: {
      data: t.arg({ type: ImportSessionInput, required: true }),
    },
    resolve: async (query, _root, args, ctx: Context) => {
      const user = requireUser(ctx)
      const samples = [...args.data.samples].sort(
        (a, b) => a.timestamp - b.timestamp,
      )
      if (samples.length === 0) {
        throw new GraphQLError('A session needs at least one sample')
      }

      const date = new Date(args.data.date)
      if (Number.isNaN(date.getTime())) {
        throw new GraphQLError('date must be an ISO timestamp')
      }

      const spanMs = Math.abs(
        samples[samples.length - 1].timestamp - samples[0].timestamp,
      )
      const durationMin = Math.max(0, Math.round(spanMs / 60_000))
      const notes = args.data.notes?.trim() || null

      const rows = samples.map((sample) => ({
        timestamp: sample.timestamp,
        ax: sample.ax,
        ay: sample.ay,
        az: sample.az,
        gx: sample.gx,
        gy: sample.gy,
        gz: sample.gz,
        mx: optionalNumber(sample.mx),
        my: optionalNumber(sample.my),
        mz: optionalNumber(sample.mz),
        roll: optionalNumber(sample.roll),
        pitch: optionalNumber(sample.pitch),
        yaw: optionalNumber(sample.yaw),
        pressure: optionalNumber(sample.pressure),
        temperature: optionalNumber(sample.temperature),
        lat: optionalNumber(sample.lat),
        lon: optionalNumber(sample.lon),
        fix: sample.fix ?? null,
        alt: optionalNumber(sample.alt),
        sat: sample.sat ?? null,
      }))

      const maneuvers = args.data.maneuvers ?? []

      return prisma.$transaction(
        async (tx) => {
          const created = await tx.session.create({
            data: {
              userId: user.id,
              date,
              durationMin,
              notes,
            },
          })

          const chunkSize = 400
          for (let i = 0; i < rows.length; i += chunkSize) {
            await tx.sample.createMany({
              data: rows.slice(i, i + chunkSize).map((row) => ({
                ...row,
                sessionId: created.id,
              })),
            })
          }

          if (maneuvers.length > 0) {
            await tx.maneuverEvent.createMany({
              data: maneuvers.map((maneuver) => ({
                sessionId: created.id,
                timestamp: maneuver.timestamp,
                type: maneuver.type,
                score: maneuver.score,
              })),
            })
          }

          return tx.session.findUniqueOrThrow({
            ...query,
            where: { id: created.id },
          })
        },
        { timeout: 60_000 },
      )
    },
  }),
)
