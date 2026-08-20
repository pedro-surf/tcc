import { Router, type Request } from 'express'
import { runWeeklyForecastJob } from '../jobs/runWeeklyForecastJob'

export const internalJobsRouter = Router()

function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = req.headers['x-cron-secret']
  const value = Array.isArray(header) ? header[0] : header
  return typeof value === 'string' && value === secret
}

internalJobsRouter.post('/jobs/weekly-forecast', async (req, res) => {
  if (!cronAuthorized(req)) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const result = await runWeeklyForecastJob()
    res.status(200).json(result)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Weekly forecast job failed'
    res.status(500).json({ error: message })
  }
})
