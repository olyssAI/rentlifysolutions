import '../config/load-environment.js'

import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { deflateSync } from 'node:zlib'

import { database, databasePool } from '../database/client.js'
import { user } from '../database/schema/auth-schema.js'
import { restaurantRepository } from '../modules/restaurants/restaurant-repository.js'
import { menuService } from '../modules/menu/menu-service.js'
import { environment } from '../config/environment.js'

const requiredValue = (name: string, value: string | undefined) => {
  assert(value, `${name} is required for the Cloudinary signed-upload integration test.`)
  return value
}

const crc32 = (value: Buffer) => {
  let checksum = 0xffffffff
  for (const byte of value) {
    checksum ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      checksum = (checksum >>> 1) ^ (checksum & 1 ? 0xedb88320 : 0)
    }
  }
  return (checksum ^ 0xffffffff) >>> 0
}

const createPngChunk = (type: string, data: Buffer) => {
  const typeBytes = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const checksum = Buffer.alloc(4)
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])))
  return Buffer.concat([length, typeBytes, data, checksum])
}

const createPolicyCompliantPngDataUrl = () => {
  const width = 320
  const height = 240
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 2
  const scanline = Buffer.alloc(1 + width * 3)
  scanline[0] = 0
  for (let pixel = 0; pixel < width; pixel += 1) {
    scanline[1 + pixel * 3] = 217
    scanline[2 + pixel * 3] = 45
    scanline[3 + pixel * 3] = 32
  }
  const image = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    createPngChunk('IHDR', header),
    createPngChunk('IDAT', deflateSync(Buffer.concat(Array.from({ length: height }, () => scanline)))),
    createPngChunk('IEND', Buffer.alloc(0)),
  ])
  return `data:image/png;base64,${image.toString('base64')}`
}

const cloudName = requiredValue('CLOUDINARY_CLOUD_NAME', environment.CLOUDINARY_CLOUD_NAME)
const apiKey = requiredValue('CLOUDINARY_API_KEY', environment.CLOUDINARY_API_KEY)
const apiSecret = requiredValue('CLOUDINARY_API_SECRET', environment.CLOUDINARY_API_SECRET)
const restaurants = await restaurantRepository.listRestaurants()
const restaurantId = restaurants[0]?.id
assert(restaurantId, 'Create at least one restaurant before running the Cloudinary signed-upload integration test.')
const [requestingUser] = await database.select({ id: user.id }).from(user).limit(1)
assert(requestingUser, 'Create at least one user before running the Cloudinary signed-upload integration test.')

let uploadedPublicId: string | undefined
try {
  const signature = await menuService.createMediaUploadSignature(restaurantId, requestingUser.id)
  const uploadBody = new FormData()
  uploadBody.set('file', createPolicyCompliantPngDataUrl())
  uploadBody.set('api_key', signature.apiKey)
  uploadBody.set('allowed_formats', signature.allowedFormatsParameter)
  uploadBody.set('timestamp', String(signature.timestamp))
  uploadBody.set('folder', signature.folder)
  uploadBody.set('public_id', signature.publicId)
  uploadBody.set('upload_preset', signature.uploadPreset)
  uploadBody.set('overwrite', 'false')
  uploadBody.set('signature', signature.signature)

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
    { method: 'POST', body: uploadBody, signal: AbortSignal.timeout(20_000) },
  )
  const uploadResult: unknown = await uploadResponse.json().catch(() => null)
  assert.equal(
    uploadResponse.status,
    200,
    `Cloudinary rejected the application-generated SHA-256 upload signature with HTTP ${uploadResponse.status}.`,
  )
  assert(
    typeof uploadResult === 'object' &&
      uploadResult !== null &&
      'public_id' in uploadResult &&
      typeof uploadResult.public_id === 'string' &&
      'secure_url' in uploadResult &&
      typeof uploadResult.secure_url === 'string',
    'Cloudinary returned an unverifiable signed-upload response.',
  )
  uploadedPublicId = uploadResult.public_id
  assert.equal(uploadedPublicId, `${signature.folder}/${signature.publicId}`)
  await menuService.validateMediaReference(restaurantId, {
    imageUrl: uploadResult.secure_url,
    imagePublicId: uploadedPublicId,
  })
  console.log(
    'Cloudinary signed-upload integration test passed with the application-generated SHA-256 signature and server-side asset policy validation.',
  )
} finally {
  if (uploadedPublicId) {
    const timestamp = Math.floor(Date.now() / 1000)
    const destroySignature = createHash('sha256')
      .update(`public_id=${uploadedPublicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')
    const destroyBody = new FormData()
    destroyBody.set('public_id', uploadedPublicId)
    destroyBody.set('timestamp', String(timestamp))
    destroyBody.set('api_key', apiKey)
    destroyBody.set('signature', destroySignature)
    const destroyResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/destroy`,
      { method: 'POST', body: destroyBody, signal: AbortSignal.timeout(20_000) },
    )
    assert.equal(destroyResponse.status, 200, 'The temporary Cloudinary integration-test asset was not removed.')
  }
  await databasePool.end()
}
