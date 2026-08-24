import { handler } from './handler'

handler({
  job: 'weekly-forecast',
  secret: process.env.CRON_SECRET,
})
  .then((result) => {
    console.log(result.body)
    if (result.statusCode >= 400) process.exitCode = 1
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
