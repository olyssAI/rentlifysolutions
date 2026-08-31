import { Router, type Response } from 'express'

import { permissionKeys } from '../authorization/permission-catalog.js'
import { requirePermission } from '../authorization/require-permission-middleware.js'
import { requireTrustedMutationOrigin } from '../authentication/authentication-middleware.js'
import { throttleAuthenticatedReads, throttleAuthenticatedWrites } from '../http/request-throttle.js'
import { parseRequestValue } from '../http/request-validation.js'
import { menuRouter } from '../menu/menu-routes.js'
import { restaurantService } from '../restaurants/restaurant-service.js'
import {
  locationIdentifierParametersSchema,
  replaceDeliveryZonesSchema,
  replaceOpeningHoursSchema,
  replaceSpecialHoursSchema,
  updateLocationSchema,
} from '../restaurants/restaurant-validation.js'
import { requireRestaurantOwner, requireWritableRestaurant } from './restaurant-owner-middleware.js'
import { updateOwnerRestaurantProfileSchema } from './restaurant-owner-validation.js'
import { HttpError } from '../http/http-error.js'
import { ownerOrderService } from '../orders/owner-order-service.js'
import {
  ownerOrderListQuerySchema,
  ownerOrderParametersSchema,
  ownerOrderStatusSchema,
} from '../orders/owner-order-validation.js'

export const restaurantOwnerRouter = Router()

const requiredRestaurantOwnerContext = (response: Response) => {
  const { restaurantId, restaurantMembership } = response.locals
  if (!restaurantId || !restaurantMembership) {
    throw new HttpError(500, 'RESTAURANT_CONTEXT_MISSING', 'Restaurant access could not be resolved.')
  }
  return { restaurantId, restaurantMembership }
}

restaurantOwnerRouter.use(requireRestaurantOwner)
restaurantOwnerRouter.use(requirePermission(permissionKeys.restaurantDashboardRead))
restaurantOwnerRouter.use(requireTrustedMutationOrigin)
restaurantOwnerRouter.use(
  throttleAuthenticatedWrites({ bucket: 'owner-workspace', windowSeconds: 60, maximumRequests: 60 }),
)

restaurantOwnerRouter.get('/context', async (_request, response) => {
  const { restaurantMembership: membership } = requiredRestaurantOwnerContext(response)
  response.status(200).json({
    success: true,
    data: {
      membership: response.locals.restaurantMembership,
      details: await restaurantService.getRestaurant(membership.restaurantId),
    },
  })
})

const throttleOwnerOrderReads = throttleAuthenticatedReads({
  bucket: 'owner-order-reads',
  windowSeconds: 60,
  maximumRequests: 120,
})

restaurantOwnerRouter.get('/orders', throttleOwnerOrderReads, async (request, response) => {
  const query = parseRequestValue(ownerOrderListQuerySchema, request.query, response)
  if (!query) return
  response.status(200).json({
    success: true,
    data: await ownerOrderService.list(requiredRestaurantOwnerContext(response).restaurantId, query),
  })
})

restaurantOwnerRouter.get('/orders/summary', throttleOwnerOrderReads, async (_request, response) => {
  response.status(200).json({
    success: true,
    data: await ownerOrderService.summary(requiredRestaurantOwnerContext(response).restaurantId),
  })
})

restaurantOwnerRouter.use(requireWritableRestaurant)

restaurantOwnerRouter.patch('/orders/:orderId/status', async (request, response) => {
  const parameters = parseRequestValue(ownerOrderParametersSchema, request.params, response)
  if (!parameters) return
  const input = parseRequestValue(ownerOrderStatusSchema, request.body, response)
  if (!input) return
  const sessionUserId = response.locals.session?.user.id
  if (!sessionUserId) throw new HttpError(500, 'OWNER_CONTEXT_MISSING', 'Owner access could not be resolved.')
  response.status(200).json({
    success: true,
    data: await ownerOrderService.transition(
      requiredRestaurantOwnerContext(response).restaurantId,
      parameters.orderId,
      input.status,
      sessionUserId,
      input.customerVisibleNote ?? null,
    ),
  })
})

restaurantOwnerRouter.patch(
  '/restaurant',
  requirePermission(permissionKeys.restaurantProfileManage),
  async (request, response) => {
    const input = parseRequestValue(updateOwnerRestaurantProfileSchema, request.body, response)
    if (!input) return
    response.status(200).json({
      success: true,
      data: await restaurantService.updateRestaurant(requiredRestaurantOwnerContext(response).restaurantId, input),
    })
  },
)

restaurantOwnerRouter.patch(
  '/locations/:locationId',
  requirePermission(permissionKeys.restaurantLocationsManage),
  async (request, response) => {
    const { restaurantId } = requiredRestaurantOwnerContext(response)
    const parameters = parseRequestValue(
      locationIdentifierParametersSchema,
      { ...request.params, restaurantId },
      response,
    )
    const input = parseRequestValue(updateLocationSchema, request.body, response)
    if (!parameters || !input) return
    response.status(200).json({
      success: true,
      data: await restaurantService.updateLocation(restaurantId, parameters.locationId, input),
    })
  },
)

restaurantOwnerRouter.put(
  '/locations/:locationId/opening-hours',
  requirePermission(permissionKeys.restaurantLocationsManage),
  async (request, response) => {
    const { restaurantId } = requiredRestaurantOwnerContext(response)
    const parameters = parseRequestValue(
      locationIdentifierParametersSchema,
      { ...request.params, restaurantId },
      response,
    )
    const input = parseRequestValue(replaceOpeningHoursSchema, request.body, response)
    if (!parameters || !input) return
    response.status(200).json({
      success: true,
      data: await restaurantService.replaceOpeningHours(restaurantId, parameters.locationId, input),
    })
  },
)

restaurantOwnerRouter.put(
  '/locations/:locationId/special-hours',
  requirePermission(permissionKeys.restaurantLocationsManage),
  async (request, response) => {
    const { restaurantId } = requiredRestaurantOwnerContext(response)
    const parameters = parseRequestValue(
      locationIdentifierParametersSchema,
      { ...request.params, restaurantId },
      response,
    )
    const input = parseRequestValue(replaceSpecialHoursSchema, request.body, response)
    if (!parameters || !input) return
    response.status(200).json({
      success: true,
      data: await restaurantService.replaceSpecialHours(restaurantId, parameters.locationId, input),
    })
  },
)

restaurantOwnerRouter.put(
  '/locations/:locationId/delivery-zones',
  requirePermission(permissionKeys.restaurantLocationsManage),
  async (request, response) => {
    const { restaurantId } = requiredRestaurantOwnerContext(response)
    const parameters = parseRequestValue(
      locationIdentifierParametersSchema,
      { ...request.params, restaurantId },
      response,
    )
    const input = parseRequestValue(replaceDeliveryZonesSchema, request.body, response)
    if (!parameters || !input) return
    response.status(200).json({
      success: true,
      data: await restaurantService.replaceDeliveryZones(restaurantId, parameters.locationId, input),
    })
  },
)

restaurantOwnerRouter.use('/menu', requirePermission(permissionKeys.restaurantMenuManage), menuRouter)
