import 'dotenv/config'
import express from 'express'
import type { NextFunction, Request, RequestHandler, Response } from 'express'
import { createYoga } from 'graphql-yoga'
import path from 'node:path'
import { schema } from './graphql/schema'
import { createContext } from './graphql/context'
import { loggingPlugin } from './graphql/logging'
import { uploadRouter, UPLOAD_DIR } from './rest/upload'
import { spotWeeklyDescriptionRouter } from './rest/spotWeeklyDescription'

const app = express()

const corsOrigins = (
  process.env.CORS_ORIGINS ??
  'http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean)

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin
  if (origin && (corsOrigins.includes('*') || corsOrigins.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  } else if (!origin && corsOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization',
  )
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  next()
})

app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/upload', uploadRouter)
app.use('/spots', spotWeeklyDescriptionRouter)

const yoga = createYoga<{
  req: Request
  res: Response
}>({
  schema,
  context: ({ req }) => createContext({ req: req as any }),
  plugins: [loggingPlugin],
})

app.use(yoga.graphqlEndpoint, yoga as unknown as RequestHandler)

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`Visit http://localhost:${port}/graphql`)
  console.log(`Uploads: http://localhost:${port}/upload`)
  console.log(`Static:  http://localhost:${port}/uploads`)
  console.log(
    `Weekly AI: POST http://localhost:${port}/spots/:spotId/weekly-description`,
  )
  console.log(`Upload dir: ${path.resolve(UPLOAD_DIR)}`)
})
