import { Router } from 'express'

import { permissionKeys } from '../authorization/permission-catalog.js'
import { requirePermission } from '../authorization/require-permission-middleware.js'
import { requireSuperAdministrator, requireTrustedMutationOrigin } from '../authentication/authentication-middleware.js'
import { throttleAuthenticatedWrites } from '../http/request-throttle.js'
import { HttpError } from '../http/http-error.js'
import { parseRequestValue } from '../http/request-validation.js'
import { menuService } from '../menu/menu-service.js'
import { restaurantService } from './restaurant-service.js'
import { restaurantOwnerService } from '../restaurant-owners/restaurant-owner-service.js'
import {
  ownerMembershipParametersSchema,
  provisionRestaurantOwnerSchema,
} from '../restaurant-owners/restaurant-owner-validation.js'
import {
  createLocationSchema,
  createRestaurantSchema,
  featureOverridesSchema,
  locationIdentifierParametersSchema,
  replaceDeliveryZonesSchema,
  replaceOpeningHoursSchema,
  replaceSpecialHoursSchema,
  restaurantIdentifierParametersSchema,
  updateLocationSchema,
  updateRestaurantSchema,
} from './restaurant-validation.js'

export const restaurantRouter = Router()

restaurantRouter.use(requireSuperAdministrator)
restaurantRouter.use(requirePermission(permissionKeys.platformRestaurantsManage))
restaurantRouter.use(requireTrustedMutationOrigin)
restaurantRouter.use(
  throttleAuthenticatedWrites({ bucket: 'admin-restaurants', windowSeconds: 60, maximumRequests: 120 }),
)
restaurantRouter.get('/packages', async (_request, response) => {
  response.status(200).json({ success: true, data: await restaurantService.listPackages() })
})

restaurantRouter.get('/', async (_request, response) => {
  response.status(200).json({ success: true, data: await restaurantService.listRestaurants() })
})

restaurantRouter.get('/:restaurantId/menu', async (request, response) => {
  const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
  if (!parameters) return
  response.status(200).json({ success: true, data: await menuService.listMenu(parameters.restaurantId) })
})

restaurantRouter.post('/', async (request, response) => {
  const input = parseRequestValue(createRestaurantSchema, request.body, response)
  if (!input) return
  const created = await restaurantService.createRestaurant(input)
  response.status(201).json({ success: true, data: created })
})

restaurantRouter.get('/:restaurantId', async (request, response) => {
  const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
  if (!parameters) return
  response.status(200).json({ success: true, data: await restaurantService.getRestaurant(parameters.restaurantId) })
})

restaurantRouter.get(
  '/:restaurantId/owners',
  requirePermission(permissionKeys.platformOwnersManage),
  async (request, response) => {
    const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
    if (!parameters) return
    response.status(200).json({ success: true, data: await restaurantOwnerService.listOwners(parameters.restaurantId) })
  },
)

restaurantRouter.post(
  '/:restaurantId/owners',
  requirePermission(permissionKeys.platformOwnersManage),
  async (request, response) => {
    const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
    const input = parseRequestValue(provisionRestaurantOwnerSchema, request.body, response)
    if (!parameters || !input) return
    response.status(201).json({
      success: true,
      data: await restaurantOwnerService.provisionPrimaryOwner(parameters.restaurantId, input),
    })
  },
)

restaurantRouter.delete(
  '/:restaurantId/owners/:membershipId',
  requirePermission(permissionKeys.platformOwnersManage),
  async (request, response) => {
    const parameters = parseRequestValue(ownerMembershipParametersSchema, request.params, response)
    if (!parameters) return
    const session = response.locals.session
    if (!session) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.')
    response.status(200).json({
      success: true,
      data: await restaurantOwnerService.revokeOwner(parameters.restaurantId, parameters.membershipId, session.user.id),
    })
  },
)

restaurantRouter.patch('/:restaurantId', async (request, response) => {
  const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(updateRestaurantSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.updateRestaurant(parameters.restaurantId, input),
  })
})

restaurantRouter.put('/:restaurantId/features', async (request, response) => {
  const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(featureOverridesSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.replaceFeatureOverrides(parameters.restaurantId, input),
  })
})

restaurantRouter.post('/:restaurantId/locations', async (request, response) => {
  const parameters = parseRequestValue(restaurantIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(createLocationSchema, request.body, response)
  if (!parameters || !input) return
  response.status(201).json({
    success: true,
    data: await restaurantService.createLocation(parameters.restaurantId, input),
  })
})

restaurantRouter.patch('/:restaurantId/locations/:locationId', async (request, response) => {
  const parameters = parseRequestValue(locationIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(updateLocationSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.updateLocation(parameters.restaurantId, parameters.locationId, input),
  })
})

restaurantRouter.put('/:restaurantId/locations/:locationId/opening-hours', async (request, response) => {
  const parameters = parseRequestValue(locationIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(replaceOpeningHoursSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.replaceOpeningHours(parameters.restaurantId, parameters.locationId, input),
  })
})

restaurantRouter.put('/:restaurantId/locations/:locationId/special-hours', async (request, response) => {
  const parameters = parseRequestValue(locationIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(replaceSpecialHoursSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.replaceSpecialHours(parameters.restaurantId, parameters.locationId, input),
  })
})

restaurantRouter.put('/:restaurantId/locations/:locationId/delivery-zones', async (request, response) => {
  const parameters = parseRequestValue(locationIdentifierParametersSchema, request.params, response)
  const input = parseRequestValue(replaceDeliveryZonesSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await restaurantService.replaceDeliveryZones(parameters.restaurantId, parameters.locationId, input),
  })
})
