import '../config/load-environment.js'

import { strict as assert } from 'node:assert'
import { z } from 'zod'

import { environment } from '../config/environment.js'
import { menuImageAllowedFormats } from '../modules/menu/menu-media-policy.js'

const requiredAllowedFormats: ReadonlySet<string> = new Set<string>(menuImageAllowedFormats)

const uploadPresetSchema = z
  .object({
    name: z.string().min(1),
    unsigned: z.boolean(),
    settings: z.object({
      allowed_formats: z.array(z.string().min(1)),
    }),
  })
  .passthrough()

assert(environment.CLOUDINARY_CLOUD_NAME, 'CLOUDINARY_CLOUD_NAME is required.')
assert(environment.CLOUDINARY_API_KEY, 'CLOUDINARY_API_KEY is required.')
assert(environment.CLOUDINARY_API_SECRET, 'CLOUDINARY_API_SECRET is required.')
assert(environment.CLOUDINARY_MENU_UPLOAD_PRESET, 'CLOUDINARY_MENU_UPLOAD_PRESET is required.')

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

assert.equal(response.status, 200, `Cloudinary preset lookup failed with HTTP ${response.status}.`)
const presetBody: unknown = await response.json()
const presetResult = uploadPresetSchema.safeParse(presetBody)
assert(
  presetResult.success,
  `Cloudinary preset is missing required security settings. Configure allowed_formats as ${menuImageAllowedFormats.join(
    ',',
  )}. Returned settings: ${
    typeof presetBody === 'object' && presetBody !== null && 'settings' in presetBody
      ? JSON.stringify(presetBody.settings)
      : 'no settings object'
  }.`,
)
const preset = presetResult.data
assert.equal(preset.unsigned, false, 'The menu upload preset must require signed uploads.')
assert(
  preset.settings.allowed_formats.every((format) => requiredAllowedFormats.has(format.toLowerCase())) &&
    requiredAllowedFormats.size === new Set(preset.settings.allowed_formats.map((format) => format.toLowerCase())).size,
  `The preset allowed_formats must be exactly ${menuImageAllowedFormats.join(', ')}.`,
)
console.log('Cloudinary menu upload preset security test passed signed-mode and exact-format checks.')
