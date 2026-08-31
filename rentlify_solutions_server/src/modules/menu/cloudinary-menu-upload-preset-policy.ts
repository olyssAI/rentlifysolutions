import { z } from 'zod'

import { environment } from '../../config/environment.js'
import { menuImageAllowedFormats } from './menu-media-policy.js'

const requiredAllowedFormats: ReadonlySet<string> = new Set<string>(menuImageAllowedFormats)
const policyCacheDurationMilliseconds = 5 * 60 * 1000

const uploadPresetSchema = z
  .object({
    unsigned: z.boolean(),
    settings: z.object({
      allowed_formats: z.array(z.string().min(1)),
    }),
  })
  .passthrough()

let cachedPolicyResult: { expiresAt: number; isSecure: boolean } | undefined
let pendingPolicyRequest: Promise<boolean> | undefined

const hasExactAllowedFormats = (allowedFormats: string[]) => {
  const configuredFormats = new Set(allowedFormats.map((format) => format.toLowerCase()))
  return (
    configuredFormats.size === requiredAllowedFormats.size &&
    [...requiredAllowedFormats].every((format) => configuredFormats.has(format))
  )
}

const fetchPresetPolicy = async () => {
  if (
    !environment.CLOUDINARY_CLOUD_NAME ||
    !environment.CLOUDINARY_API_KEY ||
    !environment.CLOUDINARY_API_SECRET ||
    !environment.CLOUDINARY_MENU_UPLOAD_PRESET
  ) {
    return false
  }

  try {
    const basicAuthentication = Buffer.from(
      `${environment.CLOUDINARY_API_KEY}:${environment.CLOUDINARY_API_SECRET}`,
    ).toString('base64')
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(environment.CLOUDINARY_CLOUD_NAME)}/upload_presets/${encodeURIComponent(environment.CLOUDINARY_MENU_UPLOAD_PRESET)}`,
      {
        headers: { Authorization: `Basic ${basicAuthentication}` },
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!response.ok) return false

    const preset = uploadPresetSchema.safeParse(await response.json())
    return preset.success && !preset.data.unsigned && hasExactAllowedFormats(preset.data.settings.allowed_formats)
  } catch {
    return false
  }
}

export const verifyCloudinaryMenuUploadPresetPolicy = async () => {
  const now = Date.now()
  if (cachedPolicyResult && cachedPolicyResult.expiresAt > now) return cachedPolicyResult.isSecure

  pendingPolicyRequest ??= fetchPresetPolicy().finally(() => {
    pendingPolicyRequest = undefined
  })
  const isSecure = await pendingPolicyRequest
  cachedPolicyResult = { isSecure, expiresAt: now + policyCacheDurationMilliseconds }
  return isSecure
}
