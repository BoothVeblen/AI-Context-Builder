import * as dotenv from 'dotenv'
import type { Config } from 'drizzle-kit'

dotenv.config({ path: '.env.local' })

const connectionString = `${process.env.DATABASE_URL}?sslmode=require`

export default {
  schema: './src/db/**/schema.ts',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  },
  out: './drizzle',
} satisfies Config
