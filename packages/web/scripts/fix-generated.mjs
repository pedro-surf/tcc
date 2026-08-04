import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, 'src/generated/graphql.tsx')
const source = readFileSync(target, 'utf8')

const next = source.replace(
  "import type { fetcher } from '../graphql/fetcher';",
  "import { fetcher } from '../graphql/fetcher';",
)

if (next === source) {
  console.warn('fix-generated: fetcher import already correct or missing')
} else {
  writeFileSync(target, next)
  console.log('fix-generated: restored value import for fetcher')
}
