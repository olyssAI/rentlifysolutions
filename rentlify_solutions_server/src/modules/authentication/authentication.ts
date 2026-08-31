import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware, isAPIError } from 'better-auth/api'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { expo } from '@better-auth/expo'
import { roles, type Role } from '@rentlify/authorization-contracts'

import { environment } from '../../config/environment.js'
import { defaultRole } from './roles.js'
import { database } from '../../database/client.js'
import * as authenticationSchema from '../../database/schema/auth-schema.js'
import { changePasswordRequestSchema, securePasswordSchema } from './password-policy.js'

type CreateAuthenticationOptions = {
  allowAccountCreation?: boolean
  basePath?: string
  cookiePrefix?: string
  enableExpo?: boolean
  newAccountRole?: Role
  trustedOrigins?: string[]
}

export const createAuthentication = ({
  allowAccountCreation = false,
  basePath = '/api/auth',
  cookiePrefix = 'rentlify',
  enableExpo = false,
  newAccountRole = defaultRole,
  trustedOrigins = environment.FRONTEND_ORIGINS,
}: CreateAuthenticationOptions = {}) =>
  betterAuth({
    appName: 'Rentlify Solutions',
    baseURL: environment.BETTER_AUTH_URL,
    basePath,
    secret: environment.BETTER_AUTH_SECRET,
    database: drizzleAdapter(database, { provider: 'pg', schema: authenticationSchema }),
    trustedOrigins,
    plugins: enableExpo ? [expo()] : [],
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowAccountCreation,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: false,
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== '/sign-up/email' && context.path !== '/change-password') return
        const validation =
          context.path === '/change-password'
            ? changePasswordRequestSchema.safeParse(context.body)
            : securePasswordSchema.safeParse(context.body.password)
        if (!validation.success) {
          throw new APIError('BAD_REQUEST', { message: 'The password does not meet the security requirements.' })
        }
      }),
      after: createAuthMiddleware(async (context) => {
        if (context.path !== '/change-password') return
        if (isAPIError(context.context.returned)) return
        const userId = context.context.session?.user.id
        if (!userId) return
        await database
          .update(authenticationSchema.user)
          .set({ passwordChangeRecommended: false })
          .where(eq(authenticationSchema.user.id, userId))
      }),
    },
    user: {
      additionalFields: {
        role: {
          type: 'string',
          required: true,
          input: false,
          defaultValue: newAccountRole,
        },
        passwordChangeRecommended: {
          type: 'boolean',
          required: true,
          input: false,
          defaultValue: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 8,
      updateAge: 60 * 60,
      freshAge: 60 * 15,
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60 * 60, max: 3 },
      },
    },
    advanced: {
      /**
       * Better Auth resolves the client IP from request headers itself; Express `trust proxy`
       * has no effect on it. Without a trusted proxy list it accepts any single-value
       * `x-forwarded-for`, so a client could rotate the header and issue itself a fresh
       * rate-limit bucket per request.
       */
      ipAddress: {
        ipAddressHeaders: ['x-forwarded-for'],
        trustedProxies: environment.TRUSTED_PROXY_IPS,
      },
      cookiePrefix,
      useSecureCookies: environment.COOKIE_SECURE,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: environment.COOKIE_SECURE,
        sameSite: environment.COOKIE_SAME_SITE,
      },
    },
    telemetry: { enabled: false },
  })

export const authentication = createAuthentication()
export const customerAuthentication = createAuthentication({
  allowAccountCreation: true,
  basePath: '/api/customer-auth',
  cookiePrefix: 'rentlify-customer',
  enableExpo: true,
  newAccountRole: roles.customer,
  trustedOrigins: [...environment.FRONTEND_ORIGINS, 'rentlify-eats://'],
})
export const auth = authentication
