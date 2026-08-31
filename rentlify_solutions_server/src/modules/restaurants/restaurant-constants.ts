export const restaurantStatuses = ['DRAFT', 'ACTIVE', 'SUSPENDED'] as const
export type RestaurantStatus = (typeof restaurantStatuses)[number]

export const locationStatuses = ['DRAFT', 'ACTIVE', 'SUSPENDED'] as const
export type LocationStatus = (typeof locationStatuses)[number]

export const fulfillmentTypes = ['DELIVERY', 'PICKUP', 'DINE_IN'] as const
export type FulfillmentType = (typeof fulfillmentTypes)[number]

export const deliveryZoneTypes = ['POSTAL_CODE', 'RADIUS'] as const
export type DeliveryZoneType = (typeof deliveryZoneTypes)[number]

export const featureKeys = [
  'ONLINE_ORDERING',
  'DELIVERY',
  'PICKUP',
  'DINE_IN',
  'SCHEDULED_ORDERS',
  'MULTI_LOCATION',
  'MENU_CUSTOMIZATIONS',
  'ALLERGENS_AND_DIETARY_LABELS',
  'CUSTOM_BRANDING',
  'ADVANCED_DELIVERY_ZONES',
  'CUSTOMER_ACCOUNTS',
  'CASH_ON_DELIVERY',
] as const

export type FeatureKey = (typeof featureKeys)[number]

/** Capabilities offered by the feedback-first MVP packages and administrator controls. */
export const sellableFeatureKeys = featureKeys.filter(
  (featureKey): featureKey is Exclude<FeatureKey, 'DINE_IN' | 'SCHEDULED_ORDERS' | 'ADVANCED_DELIVERY_ZONES'> =>
    featureKey !== 'DINE_IN' && featureKey !== 'SCHEDULED_ORDERS' && featureKey !== 'ADVANCED_DELIVERY_ZONES',
)

/**
 * Historical values accepted by database checks until an intentional cleanup migration can
 * remove them. They are not accepted by API validation or returned as package capabilities.
 */
export const persistedFeatureKeys = [
  ...featureKeys,
  'COUPONS',
  'LOYALTY',
  'PUSH_NOTIFICATIONS',
  'ORDER_TRACKING',
  'BASIC_ANALYTICS',
  'ADVANCED_ANALYTICS',
  'TABLE_ORDERING',
  'GUEST_CHECKOUT',
  'ONLINE_PAYMENTS',
] as const

export const packageSlugs = ['starter', 'growth', 'pro'] as const
export type PackageSlug = (typeof packageSlugs)[number]
