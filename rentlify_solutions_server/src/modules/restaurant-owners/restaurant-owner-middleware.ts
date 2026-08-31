import type { NextFunction, Request, Response } from 'express'
import { fromNodeHeaders } from 'better-auth/node'

import { authentication } from '../authentication/authentication.js'
import { isRestaurantOwner } from '../authentication/roles.js'
import { HttpError } from '../http/http-error.js'
import { restaurantOwnerService } from './restaurant-owner-service.js'

export const requireRestaurantOwner = async (request: Request, response: Response, next: NextFunction) => {
  let session: Awaited<ReturnType<typeof authentication.api.getSession>>
  try {
    session = await authentication.api.getSession({ headers: fromNodeHeaders(request.headers) })
  } catch (error) {
    request.log?.error({ err: error }, 'Restaurant owner session lookup failed.')
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
  if (!isRestaurantOwner(session.user.role)) {
    response.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'This account cannot access the requested resource.' },
    })
    return
  }

  let membership: Awaited<ReturnType<typeof restaurantOwnerService.getPrimaryContext>>
  try {
    membership = await restaurantOwnerService.getPrimaryContext(session.user.id)
  } catch (error) {
    if (error instanceof HttpError) {
      response.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message },
      })
      return
    }
    request.log?.error({ err: error }, 'Restaurant membership lookup failed.')
    response.status(503).json({
      success: false,
      error: { code: 'RESTAURANT_ACCESS_UNAVAILABLE', message: 'Restaurant access is temporarily unavailable.' },
    })
    return
  }
  response.locals.session = session
  response.locals.restaurantMembership = membership
  response.locals.restaurantId = membership.restaurantId
  next()
}

export const requireWritableRestaurant = (request: Request, response: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    next()
    return
  }
  const membership = response.locals.restaurantMembership
  if (!membership) {
    response.status(500).json({
      success: false,
      error: { code: 'RESTAURANT_CONTEXT_MISSING', message: 'Restaurant access could not be resolved.' },
    })
    return
  }
  if (membership.restaurantStatus === 'SUSPENDED') {
    response.status(423).json({
      success: false,
      error: {
        code: 'RESTAURANT_SUSPENDED',
        message: 'This restaurant is suspended. Changes are unavailable until access is restored.',
      },
    })
    return
  }
  next()
}
