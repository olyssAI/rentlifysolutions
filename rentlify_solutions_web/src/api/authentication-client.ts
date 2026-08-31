import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

/**
 * When the API is served from the same origin (the reverse-proxy deployment this project
 * prefers) no base URL is needed. A separate API origin must be declared explicitly so the
 * credentialed cross-site requests are aimed somewhere deliberate.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

if (!configuredApiUrl && import.meta.env.DEV) {
  console.warn(
    'VITE_API_URL is not set. Authentication requests will be sent to the current origin, which is usually wrong in development.',
  )
}

export const authenticationClient = createAuthClient({
  ...(configuredApiUrl ? { baseURL: configuredApiUrl } : {}),
  basePath: '/api/auth',
  fetchOptions: { credentials: 'include' },
  sessionOptions: {
    refetchOnWindowFocus: false,
  },
  // Mirrors the server's additional user fields so the session is typed, not cast.
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string' },
        passwordChangeRecommended: { type: 'boolean' },
      },
    }),
  ],
})
