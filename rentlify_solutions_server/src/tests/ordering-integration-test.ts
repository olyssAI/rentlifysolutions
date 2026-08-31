import '../config/load-environment.js'

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'

import { eq, inArray } from 'drizzle-orm'

import { createApplication } from '../app.js'
import { environment } from '../config/environment.js'
import { database, databasePool } from '../database/client.js'
import { user } from '../database/schema/auth-schema.js'
import {
  customerOrder,
  locationMenuItemAvailability,
  locationOpeningHour,
  menuCategory,
  menuItem,
  menuItemModifierGroup,
  modifierGroup,
  modifierOption,
  publishedMenu,
  restaurant,
  restaurantLocation,
} from '../database/schema/platform-schema.js'
import { customerAuthentication } from '../modules/authentication/authentication.js'
import { ownerOrderService } from '../modules/orders/owner-order-service.js'
import { HttpError } from '../modules/http/http-error.js'

const application = createApplication()
const server = application.listen(0, '127.0.0.1')
const suffix = `${Date.now()}-${randomUUID().slice(0, 8)}`
const restaurantId = `ordering-restaurant-${suffix}`
const restaurantSlug = `ordering-restaurant-${suffix}`
const locationId = `ordering-location-${suffix}`
const categoryId = `ordering-category-${suffix}`
const itemId = `ordering-item-${suffix}`
const modifierGroupId = `ordering-group-${suffix}`
const modifierOptionId = `ordering-option-${suffix}`
const customerEmail = `ordering-customer-${suffix}@example.test`
const otherCustomerEmail = `ordering-other-customer-${suffix}@example.test`
const customerPassword = 'OrderingCustomer#2026!'

const cookieFrom = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((value) => value.split(';', 1)[0])
    .join('; ')

try {
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address() as AddressInfo
  const serverUrl = `http://127.0.0.1:${address.port}`
  const now = new Date()
  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
  }).format(now)
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayName)
  assert.notEqual(dayOfWeek, -1)

  await database.transaction(async (transaction) => {
    await transaction.insert(restaurant).values({
      id: restaurantId,
      name: 'Ordering Integration Restaurant',
      slug: restaurantSlug,
      status: 'ACTIVE',
      packageId: 'package_pro',
      contactEmail: 'orders@example.test',
      contactPhone: '+92 300 1234567',
      publishedAt: now,
    })
    await transaction.insert(restaurantLocation).values({
      id: locationId,
      restaurantId,
      name: 'Ordering branch',
      slug: 'ordering-branch',
      status: 'ACTIVE',
      phone: '+92 300 1234567',
      addressLine1: '1 Integration Street',
      city: 'Lahore',
      province: 'Punjab',
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: false,
      scheduledOrdersEnabled: false,
      minimumOrderAmount: 0,
      deliveryFee: 5_000,
      freeDeliveryThreshold: null,
    })
    await transaction.insert(locationOpeningHour).values({
      id: randomUUID(),
      locationId,
      dayOfWeek,
      fulfillmentType: 'PICKUP',
      opensAt: '00:00',
      closesAt: '23:59',
    })
    await transaction.insert(menuCategory).values({
      id: categoryId,
      restaurantId,
      name: 'Integration meals',
      sortOrder: 0,
    })
    await transaction.insert(menuItem).values({
      id: itemId,
      restaurantId,
      categoryId,
      name: 'Integration meal',
      description: 'An authoritative ordering test item.',
      basePrice: 10_000,
      sortOrder: 0,
    })
    await transaction.insert(modifierGroup).values({
      id: modifierGroupId,
      restaurantId,
      name: 'Required size',
      minimumSelections: 1,
      maximumSelections: 1,
      sortOrder: 0,
    })
    await transaction.insert(modifierOption).values({
      id: modifierOptionId,
      modifierGroupId,
      name: 'Large',
      priceAdjustment: 2_000,
      sortOrder: 0,
    })
    await transaction.insert(menuItemModifierGroup).values({
      menuItemId: itemId,
      modifierGroupId,
      restaurantId,
      sortOrder: 0,
    })
    await transaction.insert(locationMenuItemAvailability).values({
      locationId,
      menuItemId: itemId,
      restaurantId,
      isAvailable: true,
      priceOverride: null,
    })
    await transaction.insert(publishedMenu).values({
      restaurantId,
      version: 1,
      publishedAt: now,
      snapshot: {
        restaurant: {
          id: restaurantId,
          name: 'Ordering Integration Restaurant',
          slug: restaurantSlug,
          currencyCode: 'PKR',
          timezone: 'Asia/Karachi',
        },
        locations: [{ id: locationId, name: 'Ordering branch', slug: 'ordering-branch' }],
        categories: [
          {
            id: categoryId,
            name: 'Integration meals',
            description: null,
            imageUrl: null,
            sortOrder: 0,
            items: [
              {
                id: itemId,
                categoryId,
                name: 'Integration meal',
                description: 'An authoritative ordering test item.',
                basePrice: 10_000,
                imageUrl: null,
                dietaryLabels: [],
                allergens: [],
                calories: null,
                preparationTimeMinutes: 20,
                sortOrder: 0,
                isFeatured: false,
                isSoldOut: false,
                modifierGroups: [
                  {
                    id: modifierGroupId,
                    name: 'Required size',
                    minimumSelections: 1,
                    maximumSelections: 1,
                    sortOrder: 0,
                    options: [
                      {
                        id: modifierOptionId,
                        name: 'Large',
                        priceAdjustment: 2_000,
                        sortOrder: 0,
                        isSoldOut: false,
                      },
                    ],
                  },
                ],
                locationAvailability: [{ locationId, menuItemId: itemId, isAvailable: true, priceOverride: null }],
              },
            ],
          },
        ],
        version: 1,
        publishedAt: now.toISOString(),
      },
    })
  })

  await customerAuthentication.api.signUpEmail({
    body: { name: 'Ordering Customer', email: customerEmail, password: customerPassword },
  })

  const checkoutPreflightResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/orders`, {
    method: 'OPTIONS',
    headers: {
      Origin: environment.PRIMARY_FRONTEND_ORIGIN,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type,idempotency-key',
    },
  })
  assert.equal(checkoutPreflightResponse.status, 204)
  assert.match(checkoutPreflightResponse.headers.get('access-control-allow-headers') ?? '', /idempotency-key/i)

  const unauthenticatedResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/cart/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: environment.PRIMARY_FRONTEND_ORIGIN },
    body: '{}',
  })
  assert.equal(unauthenticatedResponse.status, 401)

  const loginResponse = await fetch(`${serverUrl}/api/customer-auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: environment.PRIMARY_FRONTEND_ORIGIN },
    body: JSON.stringify({ email: customerEmail, password: customerPassword }),
  })
  assert.equal(loginResponse.status, 200)
  const customerCookie = cookieFrom(loginResponse)
  assert(customerCookie)
  const authenticatedHeaders = {
    'Content-Type': 'application/json',
    Origin: environment.PRIMARY_FRONTEND_ORIGIN,
    Cookie: customerCookie,
  }
  const cart = {
    locationId,
    fulfillmentType: 'PICKUP',
    lines: [{ menuItemId: itemId, quantity: 2, modifierOptionIds: [modifierOptionId] }],
    customer: { name: 'Ordering Customer', phone: '+92 300 7654321' },
    deliveryAddress: null,
    note: null,
  }

  const untrustedOriginResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/cart/validate`, {
    method: 'POST',
    headers: { ...authenticatedHeaders, Origin: 'https://untrusted.example' },
    body: JSON.stringify(cart),
  })
  assert.equal(untrustedOriginResponse.status, 403)

  const missingModifierResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/cart/validate`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      ...cart,
      lines: [{ menuItemId: itemId, quantity: 2, modifierOptionIds: [] }],
    }),
  })
  assert.equal(missingModifierResponse.status, 400)

  const validationResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/cart/validate`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify(cart),
  })
  assert.equal(validationResponse.status, 200)
  const validationBody = (await validationResponse.json()) as {
    data?: { subtotal?: number; deliveryFee?: number; total?: number; menuVersion?: number }
  }
  assert.equal(validationBody.data?.subtotal, 24_000)
  assert.equal(validationBody.data?.deliveryFee, 0)
  assert.equal(validationBody.data?.total, 24_000)
  assert.equal(validationBody.data?.menuVersion, 1)

  const missingIdempotencyResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/orders`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify(cart),
  })
  assert.equal(missingIdempotencyResponse.status, 400)

  const idempotencyKey = randomUUID()
  const orderHeaders = { ...authenticatedHeaders, 'Idempotency-Key': idempotencyKey }
  const orderResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/orders`, {
    method: 'POST',
    headers: orderHeaders,
    body: JSON.stringify(cart),
  })
  assert.equal(orderResponse.status, 201)
  const orderBody = (await orderResponse.json()) as { data?: { id?: string; orderNumber?: number; status?: string } }
  assert(orderBody.data?.id)
  const placedOrderId = orderBody.data.id
  assert.equal(orderBody.data.status, 'PLACED')
  assert.equal(orderBody.data.orderNumber, 1)

  const repeatedOrderResponse = await fetch(`${serverUrl}/api/customer/restaurants/${restaurantSlug}/orders`, {
    method: 'POST',
    headers: orderHeaders,
    body: JSON.stringify(cart),
  })
  assert.equal(repeatedOrderResponse.status, 201)
  const repeatedOrderBody = (await repeatedOrderResponse.json()) as { data?: { id?: string; orderNumber?: number } }
  assert.equal(repeatedOrderBody.data?.id, orderBody.data.id)
  assert.equal(repeatedOrderBody.data?.orderNumber, 1)

  const historyResponse = await fetch(`${serverUrl}/api/customer/orders`, { headers: authenticatedHeaders })
  assert.equal(historyResponse.status, 200)
  const historyBody = (await historyResponse.json()) as {
    data?: { orders?: Array<{ id?: string }>; total?: number; page?: number; totalPages?: number }
  }
  assert.equal(historyBody.data?.orders?.length, 1)
  assert.equal(historyBody.data?.orders?.[0]?.id, orderBody.data.id)
  assert.equal(historyBody.data?.total, 1)
  assert.equal(historyBody.data?.page, 1)
  assert.equal(historyBody.data?.totalPages, 1)

  const detailResponse = await fetch(`${serverUrl}/api/customer/orders/${placedOrderId}`, {
    headers: authenticatedHeaders,
  })
  assert.equal(detailResponse.status, 200)
  const detailBody = (await detailResponse.json()) as {
    data?: { id?: string; items?: Array<{ itemName?: string; modifiers?: Array<{ optionName?: string }> }> }
  }
  assert.equal(detailBody.data?.id, placedOrderId)
  assert.equal(detailBody.data?.items?.[0]?.itemName, 'Integration meal')
  assert.equal(detailBody.data?.items?.[0]?.modifiers?.[0]?.optionName, 'Large')

  await customerAuthentication.api.signUpEmail({
    body: { name: 'Other Ordering Customer', email: otherCustomerEmail, password: customerPassword },
  })
  const otherLoginResponse = await fetch(`${serverUrl}/api/customer-auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: environment.PRIMARY_FRONTEND_ORIGIN },
    body: JSON.stringify({ email: otherCustomerEmail, password: customerPassword }),
  })
  assert.equal(otherLoginResponse.status, 200)
  const otherCustomerHeaders = {
    'Content-Type': 'application/json',
    Origin: environment.PRIMARY_FRONTEND_ORIGIN,
    Cookie: cookieFrom(otherLoginResponse),
  }
  const otherHistoryResponse = await fetch(`${serverUrl}/api/customer/orders`, { headers: otherCustomerHeaders })
  assert.equal(otherHistoryResponse.status, 200)
  const otherHistoryBody = (await otherHistoryResponse.json()) as {
    data?: { orders?: unknown[]; total?: number }
  }
  assert.equal(otherHistoryBody.data?.orders?.length, 0)
  assert.equal(otherHistoryBody.data?.total, 0)
  const crossCustomerDetailResponse = await fetch(`${serverUrl}/api/customer/orders/${placedOrderId}`, {
    headers: otherCustomerHeaders,
  })
  assert.equal(crossCustomerDetailResponse.status, 404)

  const [customer] = await database.select({ id: user.id }).from(user).where(eq(user.email, customerEmail)).limit(1)
  assert(customer)
  const ownerQueue = await ownerOrderService.list(restaurantId, { scope: 'ACTIVE', page: 1, pageSize: 25 })
  assert.equal(ownerQueue.total, 1)
  assert.equal(ownerQueue.orders[0]?.items.length, 1)
  assert.equal(ownerQueue.orders[0]?.customerName, 'Ordering Customer')
  await ownerOrderService.transition(restaurantId, placedOrderId, 'ACCEPTED', customer.id, null)
  await ownerOrderService.transition(restaurantId, placedOrderId, 'PREPARING', customer.id, null)
  await ownerOrderService.transition(restaurantId, placedOrderId, 'READY', customer.id, null)
  await ownerOrderService.transition(restaurantId, placedOrderId, 'COMPLETED', customer.id, null)
  await assert.rejects(
    () => ownerOrderService.transition(restaurantId, placedOrderId, 'ACCEPTED', customer.id, null),
    (error: unknown) => error instanceof HttpError && error.code === 'INVALID_ORDER_TRANSITION',
  )

  await database.update(customerOrder).set({ archivedAt: new Date() }).where(eq(customerOrder.id, placedOrderId))
  const archivedHistoryResponse = await fetch(`${serverUrl}/api/customer/orders`, { headers: authenticatedHeaders })
  assert.equal(archivedHistoryResponse.status, 200)
  const archivedHistoryBody = (await archivedHistoryResponse.json()) as {
    data?: { orders?: unknown[]; total?: number }
  }
  assert.equal(archivedHistoryBody.data?.orders?.length, 0)
  assert.equal(archivedHistoryBody.data?.total, 0)
  const archivedDetailResponse = await fetch(`${serverUrl}/api/customer/orders/${placedOrderId}`, {
    headers: authenticatedHeaders,
  })
  assert.equal(archivedDetailResponse.status, 404)

  console.info(
    'Ordering integration test passed: customer authorization, trusted origin, modifiers, authoritative totals, idempotency, customer-owned details, archive filtering, paginated tenant queue, and safe transitions.',
  )
} finally {
  await database.delete(customerOrder).where(eq(customerOrder.restaurantId, restaurantId))
  await database.delete(restaurant).where(eq(restaurant.id, restaurantId))
  await database.delete(user).where(inArray(user.email, [customerEmail, otherCustomerEmail]))
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await databasePool.end()
}
