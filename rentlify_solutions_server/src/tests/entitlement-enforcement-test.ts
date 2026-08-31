import assert from 'node:assert/strict'

import { featureKeys } from '../modules/restaurants/restaurant-constants.js'
import {
  assertFeatureEnabled,
  assertLocationQuota,
  enforcementScope,
  isFeatureEnabled,
  multiLocationLimit,
} from '../modules/restaurants/restaurant-entitlements.js'
import { getEffectiveFeatureState } from '../modules/restaurants/restaurant-feature-state.js'
import { HttpError } from '../modules/http/http-error.js'

/** Every declared feature must state whether it is enforced; silence is how a gap hides. */
for (const featureKey of featureKeys) {
  assert(
    enforcementScope[featureKey] === 'enforced' || enforcementScope[featureKey] === 'deferred',
    `${featureKey} has no declared enforcement scope.`,
  )
}

// A feature neither the package nor an override mentions is off, not on.
const emptyState = getEffectiveFeatureState([], [])
assert.equal(isFeatureEnabled(emptyState, 'MULTI_LOCATION'), false)
assert.equal(isFeatureEnabled(emptyState, 'CUSTOM_BRANDING'), false)

// An override beats the package default in both directions.
const packageOnOverrideOff = getEffectiveFeatureState(
  [{ featureKey: 'CUSTOM_BRANDING', enabled: true }],
  [{ featureKey: 'CUSTOM_BRANDING', enabled: false }],
)
assert.equal(isFeatureEnabled(packageOnOverrideOff, 'CUSTOM_BRANDING'), false)

const packageOffOverrideOn = getEffectiveFeatureState(
  [{ featureKey: 'CUSTOM_BRANDING', enabled: false }],
  [{ featureKey: 'CUSTOM_BRANDING', enabled: true }],
)
assert.equal(isFeatureEnabled(packageOffOverrideOn, 'CUSTOM_BRANDING'), true)

assert.throws(
  () => assertFeatureEnabled(emptyState, 'CUSTOM_BRANDING', 'changing colours'),
  (error: unknown) => error instanceof HttpError && error.status === 403 && error.code === 'FEATURE_NOT_AVAILABLE',
)
assertFeatureEnabled(packageOffOverrideOn, 'CUSTOM_BRANDING', 'changing colours')

// Without MULTI_LOCATION the first location is allowed and the second is refused.
assertLocationQuota(emptyState, 0)
assert.throws(
  () => assertLocationQuota(emptyState, 1),
  (error: unknown) => error instanceof HttpError && error.status === 409 && error.code === 'LOCATION_QUOTA_EXCEEDED',
)

// MULTI_LOCATION raises the ceiling but still keeps an abuse boundary.
const multiLocationState = getEffectiveFeatureState([{ featureKey: 'MULTI_LOCATION', enabled: true }], [])
assertLocationQuota(multiLocationState, multiLocationLimit - 1)
assert.throws(
  () => assertLocationQuota(multiLocationState, multiLocationLimit),
  (error: unknown) => error instanceof HttpError && error.code === 'LOCATION_QUOTA_EXCEEDED',
)

console.info('Entitlement enforcement test passed: defaults deny, overrides win, and location quota is enforced.')
