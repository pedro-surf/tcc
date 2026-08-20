import { handler } from './handler'

handler()
  .then((result) => {
    console.log(result.body)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
