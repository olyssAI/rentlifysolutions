import {
  toLocationDetailsPayload,
  type LocationDetailsFormValues,
} from '@/modules/restaurants/validation/location-details-form-schema'

export const toCreateRestaurantLocationPayload = (
  values: LocationDetailsFormValues,
  features: { delivery: boolean; pickup: boolean; dineIn: boolean; scheduledOrders: boolean },
) => ({
  ...toLocationDetailsPayload(values),
  status: 'DRAFT',
  latitude: null,
  longitude: null,
  preparationTimeMinutes: 30,
  orderCapacityPerSlot: 20,
  deliveryEnabled: features.delivery,
  pickupEnabled: features.pickup,
  dineInEnabled: features.dineIn,
  scheduledOrdersEnabled: features.scheduledOrders,
  minimumOrderAmount: 0,
  deliveryFee: 0,
  freeDeliveryThreshold: null,
})

export type CreateRestaurantLocationPayload = ReturnType<typeof toCreateRestaurantLocationPayload>
