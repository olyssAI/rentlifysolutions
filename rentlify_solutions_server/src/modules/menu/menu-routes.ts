import { Router, type Request, type Response } from 'express'

import { HttpError } from '../http/http-error.js'
import { parseRequestValue } from '../http/request-validation.js'
import { menuService } from './menu-service.js'
import { menuPublicationService } from './menu-publication-service.js'
import {
  categoryParametersSchema,
  createCategorySchema,
  createMenuItemSchema,
  itemParametersSchema,
  mediaSignatureSchema,
  menuParametersSchema,
  updateCategorySchema,
  updateMenuItemSchema,
  availabilitySchema,
  duplicateMenuItemSchema,
} from './menu-validation.js'

export const menuRouter = Router({ mergeParams: true })

const parametersWithAuthorizedRestaurant = (request: Request, response: Response) => ({
  ...request.params,
  restaurantId: response.locals.restaurantId ?? request.params.restaurantId,
})

menuRouter.get('/', async (request, response) => {
  const parameters = parseRequestValue(
    menuParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  if (!parameters) return
  response.status(200).json({ success: true, data: await menuService.listMenu(parameters.restaurantId) })
})
menuRouter.get('/publication', async (request, response) => {
  const parameters = parseRequestValue(
    menuParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  if (!parameters) return
  response.status(200).json({
    success: true,
    data: await menuPublicationService.getPublicationState(parameters.restaurantId),
  })
})
menuRouter.post('/publication/publish', async (request, response) => {
  const parameters = parseRequestValue(
    menuParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  if (!parameters) return
  response.status(201).json({
    success: true,
    data: await menuPublicationService.publish(parameters.restaurantId),
  })
})
menuRouter.post('/categories', async (request, response) => {
  const parameters = parseRequestValue(
    menuParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(createCategorySchema, request.body, response)
  if (!parameters || !input) return
  response.status(201).json({ success: true, data: await menuService.createCategory(parameters.restaurantId, input) })
})
menuRouter.patch('/categories/:categoryId', async (request, response) => {
  const parameters = parseRequestValue(
    categoryParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(updateCategorySchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await menuService.updateCategory(parameters.restaurantId, parameters.categoryId, input),
  })
})
menuRouter.post('/items', async (request, response) => {
  const parameters = parseRequestValue(
    menuParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(createMenuItemSchema, request.body, response)
  if (!parameters || !input) return
  response.status(201).json({ success: true, data: await menuService.createItem(parameters.restaurantId, input) })
})
menuRouter.patch('/items/:itemId', async (request, response) => {
  const parameters = parseRequestValue(
    itemParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(updateMenuItemSchema, request.body, response)
  if (!parameters || !input) return
  response
    .status(200)
    .json({ success: true, data: await menuService.updateItem(parameters.restaurantId, parameters.itemId, input) })
})
menuRouter.post('/items/:itemId/duplicate', async (request, response) => {
  const parameters = parseRequestValue(
    itemParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(duplicateMenuItemSchema, request.body, response)
  if (!parameters || !input) return
  response.status(201).json({
    success: true,
    data: await menuService.duplicateItem(parameters.restaurantId, parameters.itemId, input),
  })
})
menuRouter.post('/media/upload-signature', async (request, response) => {
  const parameters = parseRequestValue(
    mediaSignatureSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  if (!parameters) return
  const session = response.locals.session
  if (!session) throw new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.')
  response.status(200).json({
    success: true,
    data: await menuService.createMediaUploadSignature(parameters.restaurantId, session.user.id),
  })
})
menuRouter.put('/items/:itemId/availability', async (request, response) => {
  const parameters = parseRequestValue(
    itemParametersSchema,
    parametersWithAuthorizedRestaurant(request, response),
    response,
  )
  const input = parseRequestValue(availabilitySchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({
    success: true,
    data: await menuService.replaceAvailability(parameters.restaurantId, parameters.itemId, input),
  })
})
