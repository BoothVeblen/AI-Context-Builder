import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'

export function createPool() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10 * 1000, // wait 10s before timing out when connecting a new client
  })
  const db = drizzle(pool)

  return {
    pool,
    db,
  }
}
