import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'

import { customerAuthentication } from '../authentication/authentication.js'
import { isCustomer } from '../authentication/roles.js'
import { environment } from '../../config/environment.js'

export const requireCustomer = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const session = await customerAuthentication.api.getSession({ headers: fromNodeHeaders(request.headers) })
    if (!session) {
      response.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.' } })
      return
    }
    if (!isCustomer(session.user.role)) {
      response
        .status(403)
        .json({ success: false, error: { code: 'FORBIDDEN', message: 'This account cannot access customer orders.' } })
      return
    }
    response.locals.session = session
    next()
  } catch (error) {
    request.log?.error({ err: error }, 'Customer session lookup failed.')
    response.status(503).json({
      success: false,
      error: { code: 'SESSION_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
    })
  }
}

export const requireCustomerMutationOrigin = (request: Request, response: Response, next: NextFunction) => {
  const origin = request.get('origin')
  if (!origin || environment.FRONTEND_ORIGINS.includes(origin) || origin === 'rentlify-eats://') {
    next()
    return
  }
  response
    .status(403)
    .json({ success: false, error: { code: 'UNTRUSTED_ORIGIN', message: 'The request origin is not allowed.' } })
}
