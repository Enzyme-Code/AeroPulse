import { Pool, types } from 'pg'

let pool: Pool | undefined

// Postgres OID 1114 = "timestamp without time zone". All of our data (CWA/EPA
// open data) stores these as Asia/Taipei wall-clock time with no offset, but
// node-postgres's default parser uses the Node process's own local timezone
// to interpret them — on any host not already running in Asia/Taipei (e.g.
// UTC, the default on most servers), that silently shifts every timestamp by
// 8 hours. Parse the raw string ourselves, anchored explicitly to +08:00.
types.setTypeParser(1114, (value: string) => new Date(`${value.replace(' ', 'T')}+08:00`))

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
