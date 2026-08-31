import { createHash } from 'node:crypto'
import { z } from 'zod'

import { environment } from '../../config/environment.js'
import { HttpError } from '../http/http-error.js'
import { menuMediaRepository } from './menu-media-repository.js'

const cloudinaryDestroyResponseSchema = z.object({ result: z.enum(['ok', 'not found']) })
const cleanupRetryDelayMilliseconds = 15 * 60 * 1000

class MenuMediaCleanupError extends Error {
  constructor(
    message: string,
    readonly reason: 'NETWORK' | 'TIMEOUT' | 'CLOUDINARY_RESPONSE',
    readonly status?: number,
  ) {
    super(message)
    this.name = 'MenuMediaCleanupError'
  }
}

const destroyCloudinaryImage = async (publicId: string) => {
  if (!environment.CLOUDINARY_CLOUD_NAME || !environment.CLOUDINARY_API_KEY || !environment.CLOUDINARY_API_SECRET) {
    throw new HttpError(503, 'MEDIA_CLEANUP_NOT_CONFIGURED', 'Menu image cleanup is not configured.')
  }
  const timestamp = Math.floor(Date.now() / 1000)
  const signedParameters = `public_id=${publicId}&timestamp=${timestamp}`
  const signature = createHash('sha256').update(`${signedParameters}${environment.CLOUDINARY_API_SECRET}`).digest('hex')
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    api_key: environment.CLOUDINARY_API_KEY,
    signature,
  })
  let response: Response
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(environment.CLOUDINARY_CLOUD_NAME)}/image/destroy`,
      { method: 'POST', body, signal: AbortSignal.timeout(15_000) },
    )
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    throw new MenuMediaCleanupError(
      timedOut ? 'Cloudinary cleanup request timed out.' : 'Cloudinary cleanup request failed.',
      timedOut ? 'TIMEOUT' : 'NETWORK',
    )
  }
  const result = cloudinaryDestroyResponseSchema.safeParse(await response.json().catch(() => null))
  if (!response.ok || !result.success)
    throw new MenuMediaCleanupError(
      `Cloudinary cleanup returned HTTP ${response.status}.`,
      'CLOUDINARY_RESPONSE',
      response.status,
    )
}

export const menuMediaCleanupService = {
  cleanupExpiredUploadIntents: async (limit = 100) => {
    const now = new Date()
    const candidates = await menuMediaRepository.listExpiredUnattached(
      now,
      new Date(now.getTime() - cleanupRetryDelayMilliseconds),
      limit,
    )
    let cleaned = 0
    let recoveredReferences = 0
    const failures: Array<{
      publicId: string
      reason: 'CONFIGURATION' | 'NETWORK' | 'TIMEOUT' | 'CLOUDINARY_RESPONSE' | 'UNEXPECTED'
      status?: number
    }> = []
    for (const candidate of candidates) {
      if (await menuMediaRepository.isReferenced(candidate.restaurantId, candidate.publicId)) {
        await menuMediaRepository.markAttached(candidate.restaurantId, candidate.publicId)
        recoveredReferences += 1
        continue
      }
      await menuMediaRepository.markCleanupAttempted(candidate.publicId)
      try {
        await destroyCloudinaryImage(candidate.publicId)
        await menuMediaRepository.markCleaned(candidate.publicId)
        cleaned += 1
      } catch (error) {
        failures.push(
          error instanceof MenuMediaCleanupError
            ? {
                publicId: candidate.publicId,
                reason: error.reason,
                ...(error.status === undefined ? {} : { status: error.status }),
              }
            : error instanceof HttpError
              ? { publicId: candidate.publicId, reason: 'CONFIGURATION', status: error.status }
              : { publicId: candidate.publicId, reason: 'UNEXPECTED' },
        )
      }
    }
    return { examined: candidates.length, cleaned, recoveredReferences, failed: failures.length, failures }
  },
}
