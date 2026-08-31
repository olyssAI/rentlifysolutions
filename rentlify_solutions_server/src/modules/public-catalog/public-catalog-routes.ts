import { Router } from 'express'

import { parseRequestValue } from '../http/request-validation.js'
import { publicCatalogService } from './public-catalog-service.js'
import { publicRestaurantParametersSchema } from './public-catalog-validation.js'
import { throttleByClientIp } from '../http/request-throttle.js'

export const publicCatalogRouter = Router()
publicCatalogRouter.use(throttleByClientIp({ bucket: 'public-catalog', windowSeconds: 60, maximumRequests: 120 }))

publicCatalogRouter.get('/:restaurantSlug/bootstrap', async (request, response) => {
  const parameters = parseRequestValue(publicRestaurantParametersSchema, request.params, response)
  if (!parameters) return
  response.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  response.status(200).json({
    success: true,
    data: await publicCatalogService.getRestaurantBootstrap(parameters.restaurantSlug),
  })
})

publicCatalogRouter.get('/:restaurantSlug/menu', async (request, response) => {
  const parameters = parseRequestValue(publicRestaurantParametersSchema, request.params, response)
  if (!parameters) return
  response.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  response.status(200).json({
    success: true,
    data: await publicCatalogService.getPublishedMenu(parameters.restaurantSlug),
  })
})
