import { findInvalidTrustedProxies } from '@better-auth/core/utils/ip'
import { z } from 'zod'

const optionalEnvironmentValue = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(8000),
    DATABASE_URL: z
      .string()
      .url()
      .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
        message: 'DATABASE_URL must use the PostgreSQL protocol.',
      }),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    FRONTEND_ORIGIN: z.string().url(),
    MARKETING_SITE_ORIGIN: z.string().url().default('http://localhost:3000'),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_SECURE: z.stringbool().default(false),
    /**
     * Comma-separated IP addresses or CIDR ranges of the reverse proxies that terminate
     * connections in front of this API, ordered innermost-last. Client IP resolution walks
     * the forwarded chain from the right and stops at the first address that is not listed,
     * so an untrusted client cannot inject its own address.
     */
    TRUSTED_PROXY_IPS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
      .superRefine((entries, context) => {
        const invalid = findInvalidTrustedProxies(entries)

        if (invalid.length > 0) {
          context.addIssue({
            code: 'custom',
            message: `TRUSTED_PROXY_IPS contains entries that are not an IP address or CIDR range: ${invalid.join(', ')}.`,
          })
        }
      }),
    SUPER_ADMIN_NAME: optionalEnvironmentValue(z.string().trim().min(1).max(100)),
    SUPER_ADMIN_EMAIL: optionalEnvironmentValue(z.string().trim().max(254).email()),
    SUPER_ADMIN_PASSWORD: optionalEnvironmentValue(z.string().min(12).max(128)),
    CLOUDINARY_CLOUD_NAME: optionalEnvironmentValue(z.string().trim().min(1).max(100)),
    CLOUDINARY_API_KEY: optionalEnvironmentValue(z.string().trim().min(1).max(100)),
    CLOUDINARY_API_SECRET: optionalEnvironmentValue(z.string().trim().min(1).max(200)),
    CLOUDINARY_MENU_UPLOAD_PRESET: optionalEnvironmentValue(z.string().trim().min(1).max(100)),
  })
  .superRefine((values, context) => {
    const cloudinaryValues = [
      values.CLOUDINARY_CLOUD_NAME,
      values.CLOUDINARY_API_KEY,
      values.CLOUDINARY_API_SECRET,
      values.CLOUDINARY_MENU_UPLOAD_PRESET,
    ]
    if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
      context.addIssue({
        code: 'custom',
        path: ['CLOUDINARY_CLOUD_NAME'],
        message: 'Configure all Cloudinary values together.',
      })
    }
    if (values.COOKIE_SAME_SITE === 'none' && !values.COOKIE_SECURE) {
      context.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE must be true when COOKIE_SAME_SITE is none.',
      })
    }

    if (values.NODE_ENV === 'production') {
      for (const [name, url] of [
        ['BETTER_AUTH_URL', values.BETTER_AUTH_URL],
        ['FRONTEND_ORIGIN', values.FRONTEND_ORIGIN],
        ['MARKETING_SITE_ORIGIN', values.MARKETING_SITE_ORIGIN],
      ] as const) {
        if (!url.startsWith('https://')) {
          context.addIssue({ code: 'custom', path: [name], message: `${name} must use HTTPS in production.` })
        }
      }

      if (!values.COOKIE_SECURE) {
        context.addIssue({
          code: 'custom',
          path: ['COOKIE_SECURE'],
          message: 'Secure cookies are required in production.',
        })
      }

      if (values.TRUSTED_PROXY_IPS.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['TRUSTED_PROXY_IPS'],
          message:
            'TRUSTED_PROXY_IPS must list the reverse proxy addresses or CIDR ranges in production. Without them a forwarded header is either spoofable or unresolvable, so authentication rate limits cannot be applied per client.',
        })
      }
    }
  })

export const environment = environmentSchema.parse(process.env)
