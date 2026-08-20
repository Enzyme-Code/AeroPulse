import { Pool } from 'pg'

let pool: Pool | undefined

export function useDb() {
  if (!pool) {
    const config = useRuntimeConfig()

    pool = new Pool({
      connectionString: config.postgres.url,
      ssl: config.postgres.ssl === 'true' ? { rejectUnauthorized: false } : false,
      max: Number(config.postgres.poolMax) || 10
    })
  }

  return pool
}
