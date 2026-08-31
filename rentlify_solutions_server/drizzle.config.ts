import './src/config/load-environment.js'

import { defineConfig } from 'drizzle-kit'

import { environment } from './src/config/environment.js'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/*.ts',
  out: './drizzle',
  dbCredentials: { url: environment.DATABASE_URL },
  strict: true,
  verbose: true,
})
