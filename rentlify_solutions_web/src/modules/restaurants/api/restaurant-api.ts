import { z } from 'zod'

import { apiRequest as request } from '@/api/api-client'
import type { LocationOperationalSettingsFormValues } from '@/modules/restaurants/validation/location-operational-settings-form-schema'
import type { CreateRestaurantLocationPayload } from '@/modules/restaurants/validation/restaurant-location-creation-payload'
import type { LocationWeeklyOpeningHoursFormValues } from '@/modules/restaurants/validation/location-weekly-opening-hours-form-schema'
import type { LocationDetailsPayload } from '@/modules/restaurants/validation/location-details-form-schema'
import type { ProvisionRestaurantOwnerPayload } from '@/modules/restaurants/validation/restaurant-owner-provisioning-form-schema'
import type { CreateRestaurantPayload } from '@/modules/restaurants/validation/restaurant-form-schema'

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/)
const nullableHttpsUrlSchema = z.string().url().startsWith('https://').nullable()

const packageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  sortOrder: z.number(),
  features: z.array(z.string()),
})

const restaurantSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  packageId: z.string(),
  packageName: z.string(),
  contactEmail: z.string(),
  primaryColor: hexColorSchema,
  locationCount: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const locationSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  slug: z.string(),
  status: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  addressLine1: z.string(),
  addressLine2: z.string().nullable(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  preparationTimeMinutes: z.number(),
  orderCapacityPerSlot: z.number(),
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  dineInEnabled: z.boolean(),
  scheduledOrdersEnabled: z.boolean(),
  minimumOrderAmount: z.number(),
  deliveryFee: z.number(),
  freeDeliveryThreshold: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const openingHourSchema = z.object({
  id: z.string(),
  locationId: z.string(),
  dayOfWeek: z.number(),
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
  opensAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
    .transform((value) => value.slice(0, 5)),
  closesAt: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
    .transform((value) => value.slice(0, 5)),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const restaurantRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  legalName: z.string().nullable(),
  description: z.string().nullable(),
  status: z.string(),
  packageId: z.string(),
  packageName: z.string(),
  contactEmail: z.string(),
  contactPhone: z.string(),
  countryCode: z.string(),
  currencyCode: z.string(),
  timezone: z.string(),
  logoUrl: nullableHttpsUrlSchema,
  coverImageUrl: nullableHttpsUrlSchema,
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  publishedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export const updatedRestaurantSchema = restaurantRecordSchema.omit({ packageName: true })

const createdRestaurantSchema = z.object({ id: z.string() }).passthrough()

const restaurantOwnerSchema = z.object({
  membershipId: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string().email(),
  membershipRole: z.literal('OWNER'),
  isPrimary: z.boolean(),
  createdAt: z.coerce.date(),
})

const provisionedRestaurantOwnerSchema = restaurantOwnerSchema.omit({ membershipRole: true, createdAt: true })

export const restaurantDetailsSchema = z.object({
  restaurant: restaurantRecordSchema,
  locations: z.array(locationSchema),
  packageFeatures: z.array(z.object({ featureKey: z.string(), enabled: z.boolean() })),
  overrides: z.array(z.object({ featureKey: z.string(), enabled: z.boolean() })),
  openingHours: z.array(openingHourSchema),
  specialHours: z.array(
    z.object({
      id: z.string(),
      locationId: z.string(),
      date: z.string(),
      fulfillmentType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
      isClosed: z.boolean(),
      opensAt: z.string().nullable(),
      closesAt: z.string().nullable(),
      reason: z.string().nullable(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
  deliveryZones: z.array(
    z.object({
      id: z.string(),
      locationId: z.string(),
      name: z.string(),
      type: z.enum(['POSTAL_CODE', 'RADIUS']),
      configuration: z.object({ postalCodes: z.array(z.string()).optional(), radiusKilometers: z.number().optional() }),
      deliveryFee: z.number(),
      minimumOrderAmount: z.number(),
      freeDeliveryThreshold: z.number().nullable(),
      isActive: z.boolean(),
      createdAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
    }),
  ),
  effectiveFeatures: z.array(
    z.object({
      featureKey: z.string(),
      packageEnabled: z.boolean(),
      override: z.boolean().nullable(),
      enabled: z.boolean(),
      isManageable: z.boolean(),
    }),
  ),
})

export type RestaurantSummary = z.infer<typeof restaurantSummarySchema>
export type RestaurantDetails = z.infer<typeof restaurantDetailsSchema>
export type SubscriptionPackage = z.infer<typeof packageSchema>
export type RestaurantLocation = z.infer<typeof locationSchema>
export type RestaurantOwner = z.infer<typeof restaurantOwnerSchema>
export type UpdateRestaurantPayload = Partial<
  Pick<
    z.infer<typeof updatedRestaurantSchema>,
    | 'name'
    | 'slug'
    | 'legalName'
    | 'description'
    | 'status'
    | 'packageId'
    | 'contactEmail'
    | 'contactPhone'
    | 'logoUrl'
    | 'coverImageUrl'
    | 'primaryColor'
    | 'accentColor'
  >
>
export type UpdateRestaurantLocationPayload = Partial<
  LocationDetailsPayload & LocationOperationalSettingsFormValues & { status: string }
>
export type FeatureOverridesPayload = { overrides: Array<{ featureKey: string; enabled: boolean }> }

export const restaurantApi = {
  list: () => request('/api/admin/restaurants', z.array(restaurantSummarySchema)),
  packages: () =>
    request(
      '/api/admin/restaurants/packages',
      z.object({ packages: z.array(packageSchema), featureKeys: z.array(z.string()) }),
    ),
  details: (restaurantId: string) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}`, restaurantDetailsSchema),
  create: (input: CreateRestaurantPayload) =>
    request('/api/admin/restaurants', createdRestaurantSchema, { method: 'POST', body: JSON.stringify(input) }),
  update: (restaurantId: string, input: UpdateRestaurantPayload) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}`, updatedRestaurantSchema, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  replaceFeatures: (restaurantId: string, input: FeatureOverridesPayload) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}/features`, restaurantDetailsSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  createLocation: (restaurantId: string, input: CreateRestaurantLocationPayload) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}/locations`, locationSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  updateLocation: (restaurantId: string, locationId: string, input: UpdateRestaurantLocationPayload) =>
    request(
      `/api/admin/restaurants/${encodeURIComponent(restaurantId)}/locations/${encodeURIComponent(locationId)}`,
      locationSchema,
      { method: 'PATCH', body: JSON.stringify(input) },
    ),
  replaceOpeningHours: (restaurantId: string, locationId: string, input: LocationWeeklyOpeningHoursFormValues) =>
    request(
      `/api/admin/restaurants/${encodeURIComponent(restaurantId)}/locations/${encodeURIComponent(locationId)}/opening-hours`,
      restaurantDetailsSchema,
      { method: 'PUT', body: JSON.stringify(input) },
    ),
  revokeOwner: (restaurantId: string, membershipId: string) =>
    request(
      `/api/admin/restaurants/${encodeURIComponent(restaurantId)}/owners/${encodeURIComponent(membershipId)}`,
      z.object({
        membershipId: z.string(),
        userId: z.string(),
        email: z.string(),
        name: z.string(),
        downgradedRole: z.boolean(),
      }),
      { method: 'DELETE' },
    ),
  listOwners: (restaurantId: string) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}/owners`, z.array(restaurantOwnerSchema)),
  provisionOwner: (restaurantId: string, input: ProvisionRestaurantOwnerPayload) =>
    request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}/owners`, provisionedRestaurantOwnerSchema, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
}
