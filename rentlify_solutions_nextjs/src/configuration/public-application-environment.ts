import { z } from 'zod'

const publicApplicationEnvironmentSchema = z.object({
  NEXT_PUBLIC_RENTLIFY_API_URL: z.string().url(),
})

export const publicApplicationEnvironment = publicApplicationEnvironmentSchema.parse({
  NEXT_PUBLIC_RENTLIFY_API_URL: process.env.NEXT_PUBLIC_RENTLIFY_API_URL ?? 'http://localhost:8000',
})
