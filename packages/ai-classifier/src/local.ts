import { handler } from './handler'
import { surfPhases } from './fixtures/surfRide'

handler({
  job: 'classify',
  secret: process.env.CRON_SECRET,
  slot: 'heuristic',
  samples: surfPhases({ kind: 'cutback' }),
})
  .then((result) => {
    console.log(result.body)
    if (result.statusCode >= 400) process.exitCode = 1
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
