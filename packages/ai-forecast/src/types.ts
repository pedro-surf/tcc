export type ForecastJob = 'weekly-forecast' | 'ingest-month' | 'weekly-description'

export type LambdaResponse = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}