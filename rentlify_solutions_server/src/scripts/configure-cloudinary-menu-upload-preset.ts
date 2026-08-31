import '../config/load-environment.js'

import assert from 'node:assert/strict'
import { z } from 'zod'

import { environment } from '../config/environment.js'
import { menuImageAllowedFormats } from '../modules/menu/menu-media-policy.js'

const requiredEnvironmentValue = (name: string, value: string | undefined) => {
  assert(value, `${name} is required to configure the Cloudinary menu upload preset.`)
  return value
}

const cloudName = requiredEnvironmentValue('CLOUDINARY_CLOUD_NAME', environment.CLOUDINARY_CLOUD_NAME)
const apiKey = requiredEnvironmentValue('CLOUDINARY_API_KEY', environment.CLOUDINARY_API_KEY)
const apiSecret = requiredEnvironmentValue('CLOUDINARY_API_SECRET', environment.CLOUDINARY_API_SECRET)
const uploadPreset = requiredEnvironmentValue(
  'CLOUDINARY_MENU_UPLOAD_PRESET',
  environment.CLOUDINARY_MENU_UPLOAD_PRESET,
)
const authorization = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`
const presetEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/upload_presets/${encodeURIComponent(uploadPreset)}`
const updateBody = new FormData()
updateBody.set('unsigned', 'false')
updateBody.set('allowed_formats', menuImageAllowedFormats.join(','))

const response = await fetch(presetEndpoint, {
  method: 'PUT',
  headers: { Authorization: authorization },
  body: updateBody,
  signal: AbortSignal.timeout(10_000),
})

assert.equal(
  response.status,
  200,
  `Cloudinary rejected the preset update with HTTP ${response.status}. No credentials were logged.`,
)

const verificationResponse = await fetch(presetEndpoint, {
  headers: { Authorization: authorization },
  signal: AbortSignal.timeout(10_000),
})
assert.equal(
  verificationResponse.status,
  200,
  `Cloudinary preset verification failed with HTTP ${verificationResponse.status}. No credentials were logged.`,
)
const verifiedPresetBody: unknown = await verificationResponse.json()
const verifiedPresetResult = z
  .object({
    unsigned: z.boolean(),
    settings: z.object({
      allowed_formats: z.array(z.string()),
    }),
  })
  .passthrough()
  .safeParse(verifiedPresetBody)
assert(
  verifiedPresetResult.success,
  `Cloudinary accepted the request but did not persist the required preset fields. Returned fields: ${
    typeof verifiedPresetBody === 'object' && verifiedPresetBody !== null
      ? Object.keys(verifiedPresetBody).sort().join(', ')
      : 'non-object response'
  }. Settings fields: ${
    typeof verifiedPresetBody === 'object' &&
    verifiedPresetBody !== null &&
    'settings' in verifiedPresetBody &&
    typeof verifiedPresetBody.settings === 'object' &&
    verifiedPresetBody.settings !== null
      ? Object.keys(verifiedPresetBody.settings).sort().join(', ')
      : 'missing settings object'
  }.`,
)
const verifiedFormats = new Set(
  verifiedPresetResult.data.settings.allowed_formats.map((format) => format.toLowerCase()),
)
assert.equal(verifiedPresetResult.data.unsigned, false, 'Cloudinary did not persist signed-only mode.')
assert.equal(verifiedFormats.size, menuImageAllowedFormats.length, 'Cloudinary persisted unexpected allowed formats.')
assert(
  menuImageAllowedFormats.every((format) => verifiedFormats.has(format)),
  'Cloudinary did not persist every allowed format.',
)
console.log(`Cloudinary upload preset "${uploadPreset}" is now signed and limited to JPG, JPEG, PNG, and WebP files.`)
