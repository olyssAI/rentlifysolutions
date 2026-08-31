import { HttpError } from '../http/http-error.js'
import type { FeatureKey } from './restaurant-constants.js'

/**
 * Entitlement enforcement.
 *
 * A package feature that is stored, displayed and never checked is not an entitlement; it is
 * decoration. Every feature that gates a capability the API can perform must be asserted here
 * at the point the capability is used, because the browser is not a boundary.
 *
 * `enforcementScope` records why each key is or is not asserted, so an unenforced key is a
 * deliberate, reviewable statement rather than an oversight.
 */
export type FeatureState = ReadonlyMap<string, boolean>

export const isFeatureEnabled = (features: FeatureState, featureKey: FeatureKey) => features.get(featureKey) === true

const featureLabels: Record<FeatureKey, string> = {
  ONLINE_ORDERING: 'Online ordering',
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup',
  DINE_IN: 'Dine-in',
  SCHEDULED_ORDERS: 'Scheduled orders',
  MULTI_LOCATION: 'Multiple locations',
  MENU_CUSTOMIZATIONS: 'Menu customisations',
  ALLERGENS_AND_DIETARY_LABELS: 'Allergens and dietary labels',
  CUSTOM_BRANDING: 'Custom branding',
  ADVANCED_DELIVERY_ZONES: 'Advanced delivery zones',
  CUSTOMER_ACCOUNTS: 'Customer accounts',
  CASH_ON_DELIVERY: 'Cash on delivery',
}

/**
 * Why each feature is or is not asserted by the current API surface.
 * `deferred` keys describe capabilities this milestone does not implement yet; they must move
 * to `enforced` in the same change that introduces the capability.
 */
export const enforcementScope: Record<FeatureKey, 'enforced' | 'deferred'> = {
  DELIVERY: 'enforced',
  PICKUP: 'enforced',
  DINE_IN: 'enforced',
  SCHEDULED_ORDERS: 'enforced',
  MULTI_LOCATION: 'enforced',
  MENU_CUSTOMIZATIONS: 'enforced',
  ALLERGENS_AND_DIETARY_LABELS: 'enforced',
  ADVANCED_DELIVERY_ZONES: 'enforced',
  CUSTOM_BRANDING: 'enforced',
  ONLINE_ORDERING: 'enforced',
  CUSTOMER_ACCOUNTS: 'enforced',
  CASH_ON_DELIVERY: 'enforced',
}

export const assertFeatureEnabled = (features: FeatureState, featureKey: FeatureKey, action: string): void => {
  if (isFeatureEnabled(features, featureKey)) return

  throw new HttpError(
    403,
    'FEATURE_NOT_AVAILABLE',
    `${featureLabels[featureKey]} is not included in this restaurant's package, so ${action} is unavailable.`,
  )
}

/**
 * Numeric limits per package feature. A boolean entitlement cannot express "one location";
 * without a ceiling, an account without MULTI_LOCATION simply creates locations one at a time.
 */
export const singleLocationLimit = 1
export const multiLocationLimit = 25

export const assertLocationQuota = (features: FeatureState, currentLocationCount: number): void => {
  const locationLimit = isFeatureEnabled(features, 'MULTI_LOCATION') ? multiLocationLimit : singleLocationLimit
  if (currentLocationCount < locationLimit) return

  throw new HttpError(
    409,
    'LOCATION_QUOTA_EXCEEDED',
    `This restaurant has reached its limit of ${locationLimit} location${locationLimit === 1 ? '' : 's'}.`,
  )
}
