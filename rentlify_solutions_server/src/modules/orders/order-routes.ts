import { Router, type Response } from 'express'
import { requireCustomer, requireCustomerMutationOrigin } from '../customers/customer-authentication-middleware.js'
import { parseRequestValue } from '../http/request-validation.js'
import { throttleAuthenticatedReads, throttleAuthenticatedWrites } from '../http/request-throttle.js'
import { HttpError } from '../http/http-error.js'
import { orderService } from './order-service.js'
import {
  cartInputSchema,
  customerOrderListQuerySchema,
  customerOrderParametersSchema,
  orderIdempotencyHeadersSchema,
  orderParametersSchema,
} from './order-validation.js'

export const orderRouter = Router()
orderRouter.use(requireCustomer)
orderRouter.use(requireCustomerMutationOrigin)
orderRouter.use(throttleAuthenticatedReads({ bucket: 'customer-order-reads', windowSeconds: 60, maximumRequests: 120 }))
orderRouter.use(throttleAuthenticatedWrites({ bucket: 'customer-orders', windowSeconds: 600, maximumRequests: 20 }))

const requiredCustomer = (response: Response) => {
  const customer = response.locals.session?.user
  if (!customer?.email) throw new HttpError(500, 'CUSTOMER_CONTEXT_MISSING', 'Customer access could not be resolved.')
  return { id: customer.id, email: customer.email }
}
orderRouter.post('/restaurants/:restaurantSlug/cart/validate', async (request, response) => {
  const parameters = parseRequestValue(orderParametersSchema, request.params, response)
  const input = parseRequestValue(cartInputSchema, request.body, response)
  if (!parameters || !input) return
  response.status(200).json({ success: true, data: await orderService.validateCart(parameters.restaurantSlug, input) })
})

orderRouter.post('/restaurants/:restaurantSlug/orders', async (request, response) => {
  const parameters = parseRequestValue(orderParametersSchema, request.params, response)
  const input = parseRequestValue(cartInputSchema, request.body, response)
  const headers = parseRequestValue(orderIdempotencyHeadersSchema, request.headers, response)
  if (!parameters || !input || !headers) return
  response.status(201).json({
    success: true,
    data: await orderService.placeOrder(
      parameters.restaurantSlug,
      input,
      requiredCustomer(response),
      headers['idempotency-key'],
    ),
  })
})

orderRouter.get('/orders', async (request, response) => {
  const query = parseRequestValue(customerOrderListQuerySchema, request.query, response)
  if (!query) return
  response.status(200).json({
    success: true,
    data: await orderService.listCustomerOrders(requiredCustomer(response).id, query),
  })
})

orderRouter.get('/orders/:orderId', async (request, response) => {
  const parameters = parseRequestValue(customerOrderParametersSchema, request.params, response)
  if (!parameters) return
  response.status(200).json({
    success: true,
    data: await orderService.getCustomerOrder(requiredCustomer(response).id, parameters.orderId),
  })
})
