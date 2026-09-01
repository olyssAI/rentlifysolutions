import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import pino from 'pino'

import { environment } from '../config/environment.js'

const databaseHostname = new URL(environment.DATABASE_URL).hostname.toLowerCase()
const usesRailwayPrivateNetwork = databaseHostname.endsWith('.railway.internal')

export const databasePool = new Pool({
  connectionString: environment.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // Rotate long-lived sockets before common managed-PostgreSQL/proxy lifetime limits.
  maxLifetimeSeconds: 300,
  // Railway's private service network is already encrypted with WireGuard and its PostgreSQL
  // template presents a self-signed certificate. Disable PostgreSQL-layer TLS only for that
  // private DNS boundary; every externally hosted production database still requires a
  // certificate chain trusted by Node.js.
  ssl: environment.NODE_ENV === 'production' && !usesRailwayPrivateNetwork ? { rejectUnauthorized: true } : false,
})

const databaseLogger = pino({ name: 'database-pool' })
databasePool.on('error', (error) => {
  // node-postgres emits this for an idle client whose socket is terminated asynchronously.
  // Attaching the listener prevents a process crash; the pool removes that client itself.
  databaseLogger.error({ err: error }, 'An idle PostgreSQL connection was terminated and removed from the pool.')
})

export const database = drizzle(databasePool)
