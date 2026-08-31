import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'

import { authentication } from './authentication.js'
import { environment } from '../../config/environment.js'
import { isSuperAdministrator } from './roles.js'

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CORS controls whether a browser exposes a response; it is not CSRF protection.
 * Cookie-authenticated mutations therefore require the exact configured web origin.
 */
export const requireTrustedMutationOrigin = (request: Request, response: Response, next: NextFunction) => {
  if (safeMethods.has(request.method) || request.get('origin') === environment.FRONTEND_ORIGIN) {
    next()
    return
  }

  response.status(403).json({
    success: false,
    error: { code: 'UNTRUSTED_ORIGIN', message: 'The request origin is not allowed.' },
  })
}

/**
 * Rejects any request that does not carry a valid database-backed session for a
 * super administrator. Access is denied by default: an unreadable session is treated
 * as no session at all.
 */
export const requireSuperAdministrator = async (request: Request, response: Response, next: NextFunction) => {
  let session: Awaited<ReturnType<typeof authentication.api.getSession>>

  try {
    session = await authentication.api.getSession({ headers: fromNodeHeaders(request.headers) })
  } catch (error) {
    request.log?.error({ err: error }, 'Session lookup failed.')
    response.status(503).json({
      success: false,
      error: { code: 'SESSION_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
    })
    return
  }

  if (!session) {
    response.status(401).json({
      success: false,
      error: { code: 'UNAUTHENTICATED', message: 'Authentication is required.' },
    })
    return
  }

  if (!isSuperAdministrator(session.user.role)) {
    response.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'This account cannot access the requested resource.' },
    })
    return
  }

  response.locals.session = session
  next()
}
