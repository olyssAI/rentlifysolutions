import type { NextFunction, Request, Response } from 'express'
import { and, eq, sql } from 'drizzle-orm'

import { database } from '../../database/client.js'
import { apiRequestThrottle } from '../../database/schema/platform-schema.js'

type ThrottleOptions = {
  /** Stable name so different routes cannot share a window by accident. */
  bucket: string
  windowSeconds: number
  maximumRequests: number
}

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * Consumes one unit from a caller's window, returning whether the request may proceed.
 * The advisory lock makes read-decide-write atomic, so concurrent requests cannot each
 * observe a count below the limit and all be admitted.
 */
export const consumeThrottleUnit = async (throttleKey: string, windowSeconds: number, maximumRequests: number) =>
  database.transaction(async (transaction) => {
    await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${`api-throttle:${throttleKey}`}))`)
    const now = new Date()
    const windowStart = new Date(now.getTime() - windowSeconds * 1000)

    const [existing] = await transaction
      .select()
      .from(apiRequestThrottle)
      .where(eq(apiRequestThrottle.throttleKey, throttleKey))
      .limit(1)

    if (!existing || existing.windowStartedAt <= windowStart) {
      await transaction
        .insert(apiRequestThrottle)
        .values({ throttleKey, windowStartedAt: now, requestCount: 1 })
        .onConflictDoUpdate({
          target: apiRequestThrottle.throttleKey,
          set: { windowStartedAt: now, requestCount: 1 },
        })
      return { allowed: true, retryAfterSeconds: 0 }
    }

    if (existing.requestCount >= maximumRequests) {
      const elapsedMilliseconds = now.getTime() - existing.windowStartedAt.getTime()
      const retryAfterSeconds = Math.max(1, Math.ceil((windowSeconds * 1000 - elapsedMilliseconds) / 1000))
      return { allowed: false, retryAfterSeconds }
    }

    await transaction
      .update(apiRequestThrottle)
      .set({ requestCount: existing.requestCount + 1 })
      .where(
        and(
          eq(apiRequestThrottle.throttleKey, throttleKey),
          eq(apiRequestThrottle.windowStartedAt, existing.windowStartedAt),
        ),
      )
    return { allowed: true, retryAfterSeconds: 0 }
  })

/**
 * Throttles authenticated write traffic. Read traffic is left alone: it is cheap relative to
 * the delete-and-reinsert writes this protects, and throttling reads breaks normal dashboard use.
 */
export const throttleAuthenticatedWrites = ({ bucket, windowSeconds, maximumRequests }: ThrottleOptions) =>
  async function throttleRequest(request: Request, response: Response, next: NextFunction) {
    if (safeMethods.has(request.method)) {
      next()
      return
    }

    const userId = response.locals.session?.user.id
    if (!userId) {
      next()
      return
    }

    let decision: Awaited<ReturnType<typeof consumeThrottleUnit>>
    try {
      decision = await consumeThrottleUnit(`${bucket}:${userId}`, windowSeconds, maximumRequests)
    } catch (error) {
      // Rate limiting is part of the authenticated boundary. Failing open would silently
      // remove that control during a migration/configuration failure or database incident.
      request.log?.error({ err: error }, 'Request throttle unavailable; denying the write.')
      next(error)
      return
    }

    if (decision.allowed) {
      next()
      return
    }

    response.setHeader('Retry-After', String(decision.retryAfterSeconds))
    response.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'Too many changes in a short time. Please wait and try again.' },
    })
  }

/** Bounds authenticated read polling without charging mutation requests to the same window. */
export const throttleAuthenticatedReads = ({ bucket, windowSeconds, maximumRequests }: ThrottleOptions) =>
  async function throttleReadRequest(request: Request, response: Response, next: NextFunction) {
    if (!safeMethods.has(request.method) || request.method === 'OPTIONS') {
      next()
      return
    }
    const userId = response.locals.session?.user.id
    if (!userId) {
      next()
      return
    }
    try {
      const decision = await consumeThrottleUnit(`${bucket}:${userId}`, windowSeconds, maximumRequests)
      if (decision.allowed) {
        next()
        return
      }
      response.setHeader('Retry-After', String(decision.retryAfterSeconds))
      response.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many refreshes. Please wait and try again.' },
      })
    } catch (error) {
      request.log?.error({ err: error }, 'Read request throttle unavailable; denying the request.')
      next(error)
    }
  }

export const throttleByClientIp = ({ bucket, windowSeconds, maximumRequests }: ThrottleOptions) =>
  async function throttleIpRequest(request: Request, response: Response, next: NextFunction) {
    const clientIp = request.ip
    if (!clientIp) {
      response.status(503).json({
        success: false,
        error: { code: 'CLIENT_IDENTITY_UNAVAILABLE', message: 'The request cannot be processed safely.' },
      })
      return
    }
    try {
      const decision = await consumeThrottleUnit(`${bucket}:${clientIp}`, windowSeconds, maximumRequests)
      if (decision.allowed) {
        next()
        return
      }
      response.setHeader('Retry-After', String(decision.retryAfterSeconds))
      response.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.' },
      })
    } catch (error) {
      request.log?.error({ err: error }, 'IP request throttle unavailable; denying the request.')
      next(error)
    }
  }
