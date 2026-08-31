import { z } from 'zod'

import { apiRequest as request } from '@/api/api-client'
import type {
  DeliveryZonesPayload,
  SpecialHoursPayload,
} from '@/modules/restaurant-owner-dashboard/validation/restaurant-owner-location-advanced-settings-form-schemas'
import type { RestaurantOwnerProfilePayload } from '@/modules/restaurant-owner-dashboard/validation/restaurant-owner-profile-form-schema'
import type { LocationOperationalSettingsFormValues } from '@/modules/restaurants/validation/location-operational-settings-form-schema'
import type { LocationWeeklyOpeningHoursFormValues } from '@/modules/restaurants/validation/location-weekly-opening-hours-form-schema'
import type { LocationDetailsPayload } from '@/modules/restaurants/validation/location-details-form-schema'

import {
  restaurantDetailsSchema,
  updatedRestaurantSchema,
  locationSchema,
} from '@/modules/restaurants/api/restaurant-api'

const ownerContextSchema = z.object({
  membership: z.object({
    membershipId: z.string(),
    restaurantId: z.string(),
    membershipRole: z.string(),
    isPrimary: z.boolean(),
    restaurantName: z.string(),
    restaurantStatus: z.string(),
  }),
  details: restaurantDetailsSchema,
})

const orderStatusSchema = z.enum(['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])
const ownerOrderSchema = z.object({
  id: z.string(),
  orderNumber: z.number().int(),
  status: orderStatusSchema,
  fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
  paymentMethod: z.literal('CASH'),
  subtotal: z.number().int(),
  deliveryFee: z.number().int(),
  total: z.number().int(),
  currencyCode: z.string().length(3),
  customerName: z.string(),
  customerEmail: z.string(),
  customerPhone: z.string(),
  deliveryAddress: z
    .object({
      addressLine1: z.string(),
      addressLine2: z.string().nullable(),
      city: z.string(),
      province: z.string(),
      postalCode: z.string().nullable(),
      instructions: z.string().nullable(),
    })
    .nullable(),
  customerNote: z.string().nullable(),
  locationId: z.string(),
  placedAt: z.coerce.date(),
  items: z.array(
    z.object({
      id: z.string(),
      orderId: z.string(),
      itemName: z.string(),
      quantity: z.number().int(),
      unitPrice: z.number().int(),
      modifierUnitTotal: z.number().int(),
      lineTotal: z.number().int(),
      modifiers: z.array(
        z.object({ groupName: z.string(), optionName: z.string(), priceAdjustment: z.number().int() }),
      ),
    }),
  ),
})

export type RestaurantOwnerContext = z.infer<typeof ownerContextSchema>
export type OwnerOrder = z.infer<typeof ownerOrderSchema>
export type OwnerOrderStatus = z.infer<typeof orderStatusSchema>
export type OwnerOrderScope = 'ACTIVE' | 'HISTORY'
export type UpdateOwnerLocationPayload = Partial<
  LocationDetailsPayload & LocationOperationalSettingsFormValues & { status: string }
>

export const restaurantOwnerApi = {
  context: () => request('/api/owner/context', ownerContextSchema),
  updateRestaurant: (input: RestaurantOwnerProfilePayload) =>
    request('/api/owner/restaurant', updatedRestaurantSchema, { method: 'PATCH', body: JSON.stringify(input) }),
  updateLocation: (locationId: string, input: UpdateOwnerLocationPayload) =>
    request(`/api/owner/locations/${encodeURIComponent(locationId)}`, locationSchema, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  replaceOpeningHours: (locationId: string, input: LocationWeeklyOpeningHoursFormValues) =>
    request(`/api/owner/locations/${encodeURIComponent(locationId)}/opening-hours`, restaurantDetailsSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  replaceSpecialHours: (locationId: string, input: SpecialHoursPayload) =>
    request(`/api/owner/locations/${encodeURIComponent(locationId)}/special-hours`, restaurantDetailsSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  replaceDeliveryZones: (locationId: string, input: DeliveryZonesPayload) =>
    request(`/api/owner/locations/${encodeURIComponent(locationId)}/delivery-zones`, restaurantDetailsSchema, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  orders: (scope: OwnerOrderScope, page: number, pageSize = 25) =>
    request(
      `/api/owner/orders?scope=${scope}&page=${page}&pageSize=${pageSize}`,
      z.object({
        orders: z.array(ownerOrderSchema),
        total: z.number().int(),
        page: z.number().int(),
        pageSize: z.number().int(),
        totalPages: z.number().int(),
      }),
    ),
  orderSummary: () =>
    request(
      '/api/owner/orders/summary',
      z.object({
        totalOrders: z.number().int(),
        activeOrders: z.number().int(),
        completedValue: z.number().int(),
        deliveryOrders: z.number().int(),
        pickupOrders: z.number().int(),
        dailyOrders: z.array(z.object({ day: z.string(), orders: z.number().int() })),
      }),
    ),
  transitionOrder: (orderId: string, status: Exclude<OwnerOrderStatus, 'PLACED'>) =>
    request(
      `/api/owner/orders/${encodeURIComponent(orderId)}/status`,
      z.object({ id: z.string(), status: orderStatusSchema }),
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    ),
}
