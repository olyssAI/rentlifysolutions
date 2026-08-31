import '../config/load-environment.js'

import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'

import { eq } from 'drizzle-orm'

import { createApplication } from '../app.js'
import { environment } from '../config/environment.js'
import { featureKeys } from '../modules/restaurants/restaurant-constants.js'
import { database, databasePool } from '../database/client.js'
import { publishedMenu, restaurant } from '../database/schema/platform-schema.js'

const requiredCredential = (name: string, value: string | undefined) => {
  assert(value, `${name} is required for the restaurant workflow integration test.`)
  return value
}

const application = createApplication()
const server = application.listen(0, '127.0.0.1')
const testSlug = `integration-restaurant-${Date.now()}`
let createdRestaurantId: string | null = null

try {
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address() as AddressInfo
  const serverUrl = `http://127.0.0.1:${address.port}`
  const origin = environment.PRIMARY_FRONTEND_ORIGIN
  const jsonHeaders = { 'Content-Type': 'application/json', Origin: origin }

  const unauthenticated = await fetch(`${serverUrl}/api/admin/restaurants`)
  assert.equal(unauthenticated.status, 401)

  const loginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      email: requiredCredential('SUPER_ADMIN_EMAIL', environment.SUPER_ADMIN_EMAIL),
      password: requiredCredential('SUPER_ADMIN_PASSWORD', environment.SUPER_ADMIN_PASSWORD),
      rememberMe: false,
    }),
  })
  assert.equal(loginResponse.status, 200)
  const cookie = loginResponse.headers
    .getSetCookie()
    .map((value) => value.split(';', 1)[0])
    .join('; ')
  const authenticatedHeaders = { ...jsonHeaders, Cookie: cookie }

  const packagesResponse = await fetch(`${serverUrl}/api/admin/restaurants/packages`, {
    headers: authenticatedHeaders,
  })
  assert.equal(packagesResponse.status, 200)
  const packagesBody = (await packagesResponse.json()) as {
    data?: { packages?: Array<{ id: string; features: string[] }> }
  }
  const selectedPackage = packagesBody.data?.packages?.find(({ features }) => !features.includes('DINE_IN'))
  assert(selectedPackage, 'The package seed must include a package without dine-in before this test.')
  const packageId = selectedPackage.id

  const invalidResponse = await fetch(`${serverUrl}/api/admin/restaurants`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ name: 'Incomplete payload' }),
  })
  assert.equal(invalidResponse.status, 400)

  const payload = {
    name: 'Integration Restaurant',
    slug: testSlug,
    legalName: null,
    description: null,
    packageId,
    contactEmail: 'integration@example.test',
    contactPhone: '+92 300 1234567',
    logoUrl: null,
    coverImageUrl: null,
    primaryColor: '#D92D20',
    accentColor: '#F7C948',
    initialLocation: {
      name: 'Main branch',
      slug: 'main-branch',
      status: 'DRAFT',
      phone: '+92 300 1234567',
      email: 'integration@example.test',
      addressLine1: '1 Test Street',
      addressLine2: null,
      city: 'Lahore',
      province: 'Punjab',
      postalCode: null,
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
  }

  const createResponse = await fetch(`${serverUrl}/api/admin/restaurants`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify(payload),
  })
  assert.equal(createResponse.status, 201)
  const createBody = (await createResponse.json()) as { data?: { id?: string } }
  createdRestaurantId = createBody.data?.id ?? null
  assert(createdRestaurantId)

  const duplicateResponse = await fetch(`${serverUrl}/api/admin/restaurants`, {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify(payload),
  })
  assert.equal(duplicateResponse.status, 409)

  const detailsResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}`, {
    headers: authenticatedHeaders,
  })
  assert.equal(detailsResponse.status, 200)
  const detailsBody = (await detailsResponse.json()) as {
    data?: { locations?: Array<{ id: string }>; effectiveFeatures?: unknown[] }
  }
  const locationId = detailsBody.data?.locations?.[0]?.id
  assert(locationId)
  assert.equal(detailsBody.data?.effectiveFeatures?.length, featureKeys.length)

  const crossRestaurantLocationResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/not-the-owner/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ city: 'Karachi' }),
    },
  )
  assert.equal(crossRestaurantLocationResponse.status, 404)

  const invalidLocationDetailsResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ name: ' ' }),
    },
  )
  assert.equal(invalidLocationDetailsResponse.status, 400)

  const updateLocationDetailsResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        name: 'Gulberg branch',
        phone: '+92 300 7654321',
        email: 'gulberg@example.com',
        addressLine1: '25 Main Boulevard',
        addressLine2: null,
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54660',
      }),
    },
  )
  assert.equal(updateLocationDetailsResponse.status, 200)
  const updateLocationDetailsBody = (await updateLocationDetailsResponse.json()) as {
    data?: { name?: string; postalCode?: string | null }
  }
  assert.equal(updateLocationDetailsBody.data?.name, 'Gulberg branch')
  assert.equal(updateLocationDetailsBody.data?.postalCode, '54660')

  const unavailableLocationCapabilityResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ dineInEnabled: true }),
    },
  )
  assert.equal(unavailableLocationCapabilityResponse.status, 403)

  const updateLocationOperationalSettingsResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ preparationTimeMinutes: 45, orderCapacityPerSlot: 15 }),
    },
  )
  assert.equal(updateLocationOperationalSettingsResponse.status, 200)
  const updateLocationOperationalSettingsBody = (await updateLocationOperationalSettingsResponse.json()) as {
    data?: { preparationTimeMinutes?: number; orderCapacityPerSlot?: number }
  }
  assert.equal(updateLocationOperationalSettingsBody.data?.preparationTimeMinutes, 45)
  assert.equal(updateLocationOperationalSettingsBody.data?.orderCapacityPerSlot, 15)

  const duplicateFeatureResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}/features`, {
    method: 'PUT',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      overrides: [
        { featureKey: 'PICKUP', enabled: true },
        { featureKey: 'PICKUP', enabled: false },
      ],
    }),
  })
  assert.equal(duplicateFeatureResponse.status, 400)

  const overlappingHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/opening-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        hours: [
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '09:00', closesAt: '14:00' },
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '13:00', closesAt: '18:00' },
        ],
      }),
    },
  )
  assert.equal(overlappingHoursResponse.status, 400)

  const overlappingOvernightHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/opening-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        hours: [
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '20:00', closesAt: '02:00' },
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '01:00', closesAt: '03:00' },
        ],
      }),
    },
  )
  assert.equal(overlappingOvernightHoursResponse.status, 400)

  const disabledFulfillmentHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/opening-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        hours: [{ dayOfWeek: 1, fulfillmentType: 'DINE_IN', opensAt: '09:00', closesAt: '18:00' }],
      }),
    },
  )
  assert.equal(disabledFulfillmentHoursResponse.status, 400)

  const validHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/opening-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        hours: [
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '09:00', closesAt: '14:00' },
          { dayOfWeek: 1, fulfillmentType: 'DELIVERY', opensAt: '15:00', closesAt: '22:00' },
          { dayOfWeek: 1, fulfillmentType: 'PICKUP', opensAt: '09:00', closesAt: '22:00' },
        ],
      }),
    },
  )
  assert.equal(validHoursResponse.status, 200)

  const radiusWithoutCoordinatesResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/delivery-zones`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        deliveryZones: [
          {
            name: 'Nearby delivery',
            type: 'RADIUS',
            postalCodes: [],
            radiusKilometers: 8,
            deliveryFee: 25000,
            minimumOrderAmount: 50000,
            freeDeliveryThreshold: 150000,
            isActive: true,
          },
        ],
      }),
    },
  )
  assert.equal(radiusWithoutCoordinatesResponse.status, 403)

  const enableMvpOverridesResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}/features`, {
    method: 'PUT',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      overrides: [
        { featureKey: 'MULTI_LOCATION', enabled: true },
        { featureKey: 'MENU_CUSTOMIZATIONS', enabled: true },
        { featureKey: 'ALLERGENS_AND_DIETARY_LABELS', enabled: true },
      ],
    }),
  })
  assert.equal(enableMvpOverridesResponse.status, 200)

  const excludedDeliveryZoneOverrideResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/features`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        overrides: [{ featureKey: 'ADVANCED_DELIVERY_ZONES', enabled: true }],
      }),
    },
  )
  assert.equal(excludedDeliveryZoneOverrideResponse.status, 400)

  const createAdditionalLocationResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        ...payload.initialLocation,
        name: 'Second branch',
        slug: 'second-branch',
      }),
    },
  )
  assert.equal(createAdditionalLocationResponse.status, 201)

  const radiusWithoutCoordinatesAfterEntitlementResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/delivery-zones`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        deliveryZones: [
          {
            name: 'Nearby delivery',
            type: 'RADIUS',
            postalCodes: [],
            radiusKilometers: 8,
            deliveryFee: 25000,
            minimumOrderAmount: 50000,
            freeDeliveryThreshold: 150000,
            isActive: true,
          },
        ],
      }),
    },
  )
  assert.equal(radiusWithoutCoordinatesAfterEntitlementResponse.status, 403)

  const postalZoneResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/delivery-zones`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        deliveryZones: [
          {
            name: 'Lahore central',
            type: 'POSTAL_CODE',
            postalCodes: ['54000', ' 54010 '],
            radiusKilometers: null,
            deliveryFee: 25000,
            minimumOrderAmount: 50000,
            freeDeliveryThreshold: 150000,
            isActive: true,
          },
        ],
      }),
    },
  )
  assert.equal(postalZoneResponse.status, 403)

  const duplicateSpecialHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/special-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        specialHours: [
          { date: '2026-12-25', fulfillmentType: 'DELIVERY', isClosed: true, opensAt: null, closesAt: null },
          { date: '2026-12-25', fulfillmentType: 'DELIVERY', isClosed: true, opensAt: null, closesAt: null },
        ],
      }),
    },
  )
  assert.equal(duplicateSpecialHoursResponse.status, 400)

  const specialHoursResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}/special-hours`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        specialHours: [
          {
            date: '2026-12-25',
            fulfillmentType: 'DELIVERY',
            isClosed: true,
            opensAt: null,
            closesAt: null,
            reason: 'Public holiday',
          },
        ],
      }),
    },
  )
  assert.equal(specialHoursResponse.status, 200)

  const prematureActivationResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}`, {
    method: 'PATCH',
    headers: authenticatedHeaders,
    body: JSON.stringify({ status: 'ACTIVE' }),
  })
  assert.equal(prematureActivationResponse.status, 409)

  const unavailablePublicRestaurantResponse = await fetch(`${serverUrl}/api/public/restaurants/${testSlug}/bootstrap`)
  assert.equal(unavailablePublicRestaurantResponse.status, 404)

  const activateLocationResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/locations/${locationId}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ status: 'ACTIVE' }),
    },
  )
  assert.equal(activateLocationResponse.status, 200)

  const activateResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}`, {
    method: 'PATCH',
    headers: authenticatedHeaders,
    body: JSON.stringify({ status: 'ACTIVE' }),
  })
  assert.equal(activateResponse.status, 200)

  const publicBootstrapResponse = await fetch(`${serverUrl}/api/public/restaurants/${testSlug}/bootstrap`)
  assert.equal(publicBootstrapResponse.status, 200)
  const publicBootstrapBody = (await publicBootstrapResponse.json()) as {
    data?: { restaurant?: { name?: string }; locations?: Array<{ id?: string }> }
  }
  assert.equal(publicBootstrapBody.data?.restaurant?.name, payload.name)
  assert.equal(publicBootstrapBody.data?.locations?.[0]?.id, locationId)

  const unpublishedMenuResponse = await fetch(`${serverUrl}/api/public/restaurants/${testSlug}/menu`)
  assert.equal(unpublishedMenuResponse.status, 404)

  const publishedAt = new Date()
  await database.insert(publishedMenu).values({
    restaurantId: createdRestaurantId,
    version: 1,
    publishedAt,
    snapshot: {
      restaurant: {
        id: createdRestaurantId,
        name: payload.name,
        slug: testSlug,
        currencyCode: 'PKR',
        timezone: 'Asia/Karachi',
      },
      locations: [{ id: locationId, name: 'Gulberg branch', slug: 'main-branch' }],
      categories: [
        {
          id: 'public-test-category',
          name: 'Featured',
          description: null,
          imageUrl: null,
          sortOrder: 0,
          items: [
            {
              id: 'public-test-item',
              restaurantId: createdRestaurantId,
              categoryId: 'public-test-category',
              name: 'Published meal',
              description: 'Visible only through the published snapshot.',
              basePrice: 99_000,
              imageUrl: null,
              imagePublicId: 'must-not-be-public',
              dietaryLabels: [],
              allergens: [],
              calories: null,
              preparationTimeMinutes: 20,
              sortOrder: 0,
              isFeatured: true,
              isSoldOut: false,
              modifierGroups: [],
              locationAvailability: [],
            },
          ],
        },
      ],
      version: 1,
      publishedAt: publishedAt.toISOString(),
    },
  })

  const publishedMenuResponse = await fetch(`${serverUrl}/api/public/restaurants/${testSlug}/menu`)
  assert.equal(publishedMenuResponse.status, 200)
  const publishedMenuBody = (await publishedMenuResponse.json()) as {
    data?: { categories?: Array<{ items?: Array<Record<string, unknown>> }> }
  }
  const publicItem = publishedMenuBody.data?.categories?.[0]?.items?.[0]
  assert.equal(publicItem?.name, 'Published meal')
  assert.equal('restaurantId' in (publicItem ?? {}), false)
  assert.equal('imagePublicId' in (publicItem ?? {}), false)

  const administratorMenuResponse = await fetch(`${serverUrl}/api/admin/restaurants/${createdRestaurantId}/menu`, {
    headers: authenticatedHeaders,
  })
  assert.equal(administratorMenuResponse.status, 200)
  const administratorMenuBody = (await administratorMenuResponse.json()) as {
    data?: { categories?: unknown[]; items?: unknown[] }
  }
  assert.deepEqual(administratorMenuBody.data?.categories, [])
  assert.deepEqual(administratorMenuBody.data?.items, [])

  const unauthenticatedAdministratorMenuResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/menu`,
  )
  assert.equal(unauthenticatedAdministratorMenuResponse.status, 401)

  const administratorMenuMutationResponse = await fetch(
    `${serverUrl}/api/admin/restaurants/${createdRestaurantId}/menu/categories`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ name: 'Forbidden administrator category' }),
    },
  )
  assert.equal(administratorMenuMutationResponse.status, 404)

  console.info(
    'Restaurant workflow integration test passed: authentication, restaurant operations, entitlement-safe configuration, public restaurant bootstrap, sanitized published-menu reads, unpublished-menu denial, read-only administrator menu visibility, and denial of administrator menu mutations.',
  )
} finally {
  if (createdRestaurantId) await database.delete(restaurant).where(eq(restaurant.id, createdRestaurantId))
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await databasePool.end()
}
