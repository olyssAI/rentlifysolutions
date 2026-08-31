import '../config/load-environment.js'

import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'

import { eq, inArray } from 'drizzle-orm'

import { createApplication } from '../app.js'
import { environment } from '../config/environment.js'
import { database, databasePool } from '../database/client.js'
import { user } from '../database/schema/auth-schema.js'
import { restaurant } from '../database/schema/platform-schema.js'

const requiredCredential = (name: string, value: string | undefined) => {
  assert(value, `${name} is required for the restaurant-owner access integration test.`)
  return value
}

const application = createApplication()
const server = application.listen(0, '127.0.0.1')
const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const ownerEmail = `owner-access-test-${uniqueSuffix}@example.test`
const initialOwnerPassword = 'OwnerAccess#2026!'
const changedOwnerPassword = 'ChangedOwner#2026!'
const createdRestaurantIds: string[] = []
let createdOwnerUserId: string | null = null

const createCookie = (response: Response) =>
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
  const testIpSuffix = randomUUID().replaceAll('-', '').slice(0, 4)
  const testIp = `198.18.${Number.parseInt(testIpSuffix.slice(0, 2), 16)}.${Number.parseInt(testIpSuffix.slice(2), 16)}`
  const jsonHeaders = {
    'Content-Type': 'application/json',
    Origin: environment.FRONTEND_ORIGIN,
    'X-Forwarded-For': testIp,
  }
  const administratorLoginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      email: requiredCredential('SUPER_ADMIN_EMAIL', environment.SUPER_ADMIN_EMAIL),
      password: requiredCredential('SUPER_ADMIN_PASSWORD', environment.SUPER_ADMIN_PASSWORD),
      rememberMe: false,
    }),
  })
  assert.equal(administratorLoginResponse.status, 200)
  const administratorHeaders = { ...jsonHeaders, Cookie: createCookie(administratorLoginResponse) }

  const packagesResponse = await fetch(`${serverUrl}/api/admin/restaurants/packages`, {
    headers: administratorHeaders,
  })
  assert.equal(packagesResponse.status, 200)
  const packagesBody = (await packagesResponse.json()) as {
    data?: { packages?: Array<{ id: string; features: string[] }> }
  }
  const selectedPackage = packagesBody.data?.packages?.find(({ features }) =>
    features.some((feature) => ['DELIVERY', 'PICKUP', 'DINE_IN'].includes(feature)),
  )
  assert(selectedPackage)

  const createRestaurant = async (label: string) => {
    const normalizedLabel = label.toLowerCase()
    const response = await fetch(`${serverUrl}/api/admin/restaurants`, {
      method: 'POST',
      headers: administratorHeaders,
      body: JSON.stringify({
        name: `${label} owner access test restaurant`,
        slug: `${normalizedLabel}-owner-access-test-${uniqueSuffix}`,
        legalName: null,
        description: null,
        packageId: selectedPackage.id,
        contactEmail: `${normalizedLabel}-${ownerEmail}`,
        contactPhone: '+92 300 1234567',
        logoUrl: null,
        coverImageUrl: null,
        primaryColor: '#D92D20',
        accentColor: '#F7C948',
        initialLocation: {
          name: `${label} branch`,
          slug: `${normalizedLabel}-branch`,
          status: 'DRAFT',
          phone: '+92 300 1234567',
          email: `${normalizedLabel}-${ownerEmail}`,
          addressLine1: '1 Integration Street',
          addressLine2: null,
          city: 'Lahore',
          province: 'Punjab',
          postalCode: '54000',
          latitude: null,
          longitude: null,
          preparationTimeMinutes: 30,
          orderCapacityPerSlot: 20,
          deliveryEnabled: selectedPackage.features.includes('DELIVERY'),
          pickupEnabled: selectedPackage.features.includes('PICKUP'),
          dineInEnabled: selectedPackage.features.includes('DINE_IN'),
          scheduledOrdersEnabled: selectedPackage.features.includes('SCHEDULED_ORDERS'),
          minimumOrderAmount: 0,
          deliveryFee: 0,
          freeDeliveryThreshold: null,
        },
      }),
    })
    assert.equal(response.status, 201)
    const body = (await response.json()) as { data?: { id?: string } }
    assert(body.data?.id)
    createdRestaurantIds.push(body.data.id)
    const detailsResponse = await fetch(`${serverUrl}/api/admin/restaurants/${body.data.id}`, {
      headers: administratorHeaders,
    })
    assert.equal(detailsResponse.status, 200)
    const detailsBody = (await detailsResponse.json()) as { data?: { locations?: Array<{ id?: string }> } }
    const locationId = detailsBody.data?.locations?.[0]?.id
    assert(locationId)
    return { restaurantId: body.data.id, locationId }
  }

  const ownedRestaurant = await createRestaurant('Primary')
  const foreignRestaurant = await createRestaurant('Foreign')

  const weakProvisioningResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}/owners`,
    {
      method: 'POST',
      headers: administratorHeaders,
      body: JSON.stringify({ name: 'Owner Access Test', email: ownerEmail, password: 'weak-password' }),
    },
  )
  assert.equal(weakProvisioningResponse.status, 400)

  const provisioningResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}/owners`,
    {
      method: 'POST',
      headers: administratorHeaders,
      body: JSON.stringify({ name: 'Owner Access Test', email: ownerEmail, password: initialOwnerPassword }),
    },
  )
  assert.equal(provisioningResponse.status, 201)
  const provisioningBody = (await provisioningResponse.json()) as {
    data?: { membershipId?: string; userId?: string; isPrimary?: boolean }
  }
  assert(provisioningBody.data?.membershipId)
  assert(provisioningBody.data?.userId)
  createdOwnerUserId = provisioningBody.data.userId
  assert.equal(provisioningBody.data.isPrimary, true)

  const duplicatePrimaryResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}/owners`,
    {
      method: 'POST',
      headers: administratorHeaders,
      body: JSON.stringify({
        name: 'Another Owner',
        email: `another-${ownerEmail}`,
        password: initialOwnerPassword,
      }),
    },
  )
  assert.equal(duplicatePrimaryResponse.status, 409)

  const reusedEmailResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${foreignRestaurant.restaurantId}/owners`,
    {
      method: 'POST',
      headers: administratorHeaders,
      body: JSON.stringify({ name: 'Reused Owner', email: ownerEmail.toUpperCase(), password: initialOwnerPassword }),
    },
  )
  assert.equal(reusedEmailResponse.status, 409)

  const ownerLoginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email: ownerEmail, password: initialOwnerPassword, rememberMe: false }),
  })
  assert.equal(ownerLoginResponse.status, 200)
  const ownerCookie = createCookie(ownerLoginResponse)
  const ownerHeaders = { ...jsonHeaders, Cookie: ownerCookie }

  const ownerAdminAccessResponse = await fetch(`${serverUrl}/api/admin/restaurants`, { headers: ownerHeaders })
  assert.equal(ownerAdminAccessResponse.status, 403)

  const contextResponse = await fetch(`${serverUrl}/api/owner/context`, { headers: ownerHeaders })
  assert.equal(contextResponse.status, 200)
  const contextBody = (await contextResponse.json()) as {
    data?: { membership?: { restaurantId?: string; isPrimary?: boolean } }
  }
  assert.equal(contextBody.data?.membership?.restaurantId, ownedRestaurant.restaurantId)
  assert.equal(contextBody.data?.membership?.isPrimary, true)

  const administratorOwnerOrdersResponse = await fetch(`${serverUrl}/api/owner/orders`, {
    headers: administratorHeaders,
  })
  assert.equal(administratorOwnerOrdersResponse.status, 403)
  const ownerOrdersResponse = await fetch(`${serverUrl}/api/owner/orders`, { headers: ownerHeaders })
  assert.equal(ownerOrdersResponse.status, 200)
  const ownerOrdersBody = (await ownerOrdersResponse.json()) as {
    data?: { orders?: unknown[]; total?: number; page?: number; totalPages?: number }
  }
  assert.deepEqual(ownerOrdersBody.data?.orders, [])
  assert.equal(ownerOrdersBody.data?.total, 0)
  assert.equal(ownerOrdersBody.data?.page, 1)
  assert.equal(ownerOrdersBody.data?.totalPages, 1)
  const ownerOrderSummaryResponse = await fetch(`${serverUrl}/api/owner/orders/summary`, { headers: ownerHeaders })
  assert.equal(ownerOrderSummaryResponse.status, 200)
  const ownerOrderSummaryBody = (await ownerOrderSummaryResponse.json()) as {
    data?: {
      totalOrders?: number
      activeOrders?: number
      completedValue?: number
      deliveryOrders?: number
      pickupOrders?: number
      dailyOrders?: unknown[]
    }
  }
  assert.deepEqual(ownerOrderSummaryBody.data, {
    totalOrders: 0,
    activeOrders: 0,
    completedValue: 0,
    deliveryOrders: 0,
    pickupOrders: 0,
    dailyOrders: [],
  })
  const malformedOrderStatusResponse = await fetch(`${serverUrl}/api/owner/orders/not-an-order/status`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ status: 'PLACED', restaurantId: foreignRestaurant.restaurantId }),
  })
  assert.equal(malformedOrderStatusResponse.status, 400)
  const clientScopedOrderStatusResponse = await fetch(`${serverUrl}/api/owner/orders/${randomUUID()}/status`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ status: 'ACCEPTED', restaurantId: foreignRestaurant.restaurantId }),
  })
  assert.equal(clientScopedOrderStatusResponse.status, 400)
  const foreignOrderStatusResponse = await fetch(`${serverUrl}/api/owner/orders/${randomUUID()}/status`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ status: 'ACCEPTED' }),
  })
  assert.equal(foreignOrderStatusResponse.status, 404)
  const untrustedOrderStatusResponse = await fetch(`${serverUrl}/api/owner/orders/${randomUUID()}/status`, {
    method: 'PATCH',
    headers: { ...ownerHeaders, Origin: 'https://untrusted.example' },
    body: JSON.stringify({ status: 'ACCEPTED' }),
  })
  assert.equal(untrustedOrderStatusResponse.status, 403)

  const ownerLocationCreationResponse = await fetch(`${serverUrl}/api/owner/locations`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      name: 'Owner-created branch',
      phone: '+923001234567',
      addressLine1: '1 Owner Street',
      city: 'Karachi',
      province: 'Sindh',
      countryCode: 'PK',
      timezone: 'Asia/Karachi',
      status: 'DRAFT',
    }),
  })
  assert.equal(ownerLocationCreationResponse.status, 404)

  const ownerAdminLocationCreationResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}/locations`,
    {
      method: 'POST',
      headers: ownerHeaders,
      body: JSON.stringify({ name: 'Owner-created admin branch' }),
    },
  )
  assert.equal(ownerAdminLocationCreationResponse.status, 403)

  const ownLocationMutationResponse = await fetch(`${serverUrl}/api/owner/locations/${ownedRestaurant.locationId}`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ city: 'Islamabad' }),
  })
  assert.equal(ownLocationMutationResponse.status, 200)

  const foreignLocationMutationResponse = await fetch(
    `${serverUrl}/api/owner/locations/${foreignRestaurant.locationId}`,
    {
      method: 'PATCH',
      headers: ownerHeaders,
      body: JSON.stringify({ city: 'Karachi' }),
    },
  )
  assert.equal(foreignLocationMutationResponse.status, 404)

  const ownRestaurantMutationResponse = await fetch(`${serverUrl}/api/owner/restaurant`, {
    method: 'PATCH',
    headers: ownerHeaders,
    body: JSON.stringify({ description: 'Updated only through membership-derived restaurant access.' }),
  })
  assert.equal(ownRestaurantMutationResponse.status, 200)

  const ownerMenuCategoryResponse = await fetch(`${serverUrl}/api/owner/menu/categories`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({
      name: 'Owner access test category',
      description: null,
      imageUrl: null,
      imagePublicId: null,
      sortOrder: 0,
      isActive: true,
    }),
  })
  assert.equal(ownerMenuCategoryResponse.status, 201)

  const weakPasswordChangeResponse = await fetch(`${serverUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ currentPassword: initialOwnerPassword, newPassword: 'weak-password' }),
  })
  assert.equal(weakPasswordChangeResponse.status, 400)
  const [ownerAfterFailedPasswordChange] = await database
    .select({ passwordChangeRecommended: user.passwordChangeRecommended })
    .from(user)
    .where(eq(user.email, ownerEmail))
    .limit(1)
  assert.equal(ownerAfterFailedPasswordChange?.passwordChangeRecommended, true)

  const passwordChangeResponse = await fetch(`${serverUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: ownerHeaders,
    body: JSON.stringify({ currentPassword: initialOwnerPassword, newPassword: changedOwnerPassword }),
  })
  assert.equal(passwordChangeResponse.status, 200)
  const [ownerAfterSuccessfulPasswordChange] = await database
    .select({ passwordChangeRecommended: user.passwordChangeRecommended })
    .from(user)
    .where(eq(user.email, ownerEmail))
    .limit(1)
  assert.equal(ownerAfterSuccessfulPasswordChange?.passwordChangeRecommended, false)

  const changedPasswordLoginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email: ownerEmail, password: changedOwnerPassword, rememberMe: false }),
  })
  assert.equal(changedPasswordLoginResponse.status, 200)

  const suspendRestaurantResponse = await fetch(`${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}`, {
    method: 'PATCH',
    headers: administratorHeaders,
    body: JSON.stringify({ status: 'SUSPENDED' }),
  })
  assert.equal(suspendRestaurantResponse.status, 200)

  const suspendedOwnerMutationResponse = await fetch(`${serverUrl}/api/owner/restaurant`, {
    method: 'PATCH',
    headers: { ...jsonHeaders, Cookie: createCookie(changedPasswordLoginResponse) },
    body: JSON.stringify({ description: 'This mutation must be rejected.' }),
  })
  assert.equal(suspendedOwnerMutationResponse.status, 423)

  const revokeOwnerResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${ownedRestaurant.restaurantId}/owners/${provisioningBody.data.membershipId}`,
    { method: 'DELETE', headers: administratorHeaders },
  )
  assert.equal(revokeOwnerResponse.status, 200)

  const revokedSessionResponse = await fetch(`${serverUrl}/api/owner/context`, {
    headers: { ...jsonHeaders, Cookie: createCookie(changedPasswordLoginResponse) },
  })
  assert.equal(revokedSessionResponse.status, 401)

  console.info(
    'Restaurant-owner access integration test passed: provisioning validation, uniqueness, login, role denial, membership context, owner order isolation and strict mutation validation, owner location-creation denial across owner and admin routes, owner location editing, cross-tenant rejection, owner menu scope, password policy, suspension enforcement, owner revocation, and session invalidation.',
  )
} finally {
  if (createdOwnerUserId) await database.delete(user).where(eq(user.id, createdOwnerUserId))
  if (createdRestaurantIds.length > 0)
    await database.delete(restaurant).where(inArray(restaurant.id, createdRestaurantIds))
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await databasePool.end()
}
