import express from 'express'
import type { Request, RequestHandler, Response } from 'express'
import { createYoga } from 'graphql-yoga'
import path from 'node:path'
import { schema } from './graphql/schema'
import { createContext } from './graphql/context'
import { loggingPlugin } from './graphql/logging'
import { uploadRouter, UPLOAD_DIR } from './rest/upload'

const app = express()

app.use('/uploads', express.static(UPLOAD_DIR))
app.use('/upload', uploadRouter)

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
  console.log(`Upload dir: ${path.resolve(UPLOAD_DIR)}`)
})
