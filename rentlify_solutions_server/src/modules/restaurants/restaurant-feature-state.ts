import { featureKeys } from './restaurant-constants.js'

/**
 * Resolves the features a restaurant actually has: the package defaults, with any
 * per-restaurant override applied on top. A key that neither source mentions is disabled,
 * so an unknown or newly added feature denies by default rather than leaking access.
 */
export const getEffectiveFeatureState = (
  packageFeatures: Array<{ featureKey: string; enabled: boolean }>,
  overrides: Array<{ featureKey: string; enabled: boolean }>,
): ReadonlyMap<string, boolean> => {
  const packageDefaults = new Map(packageFeatures.map((feature) => [feature.featureKey, feature.enabled]))
  const overrideValues = new Map(overrides.map((feature) => [feature.featureKey, feature.enabled]))
  return new Map(
    featureKeys.map((featureKey) => [
      featureKey,
      overrideValues.get(featureKey) ?? packageDefaults.get(featureKey) ?? false,
    ]),
  )
}
