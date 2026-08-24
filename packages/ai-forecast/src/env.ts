import fs from 'node:fs'
import path from 'node:path'
import dotenv from 'dotenv'

function fillEmptyFrom(file: string) {
  if (!fs.existsSync(file)) return
  const parsed = dotenv.parse(fs.readFileSync(file))
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

fillEmptyFrom(path.resolve(process.cwd(), '../backend/.env'))
fillEmptyFrom(path.resolve(process.cwd(), '.env'))
dotenv.config()
