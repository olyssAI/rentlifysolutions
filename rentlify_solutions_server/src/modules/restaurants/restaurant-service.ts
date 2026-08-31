import { HttpError } from '../http/http-error.js'
import { featureKeys, sellableFeatureKeys } from './restaurant-constants.js'
import {
  assertFeatureEnabled,
  assertLocationQuota,
  isFeatureEnabled,
  multiLocationLimit,
  singleLocationLimit,
} from './restaurant-entitlements.js'
import { getEffectiveFeatureState } from './restaurant-feature-state.js'
import { withRestaurantConfigurationLock } from './restaurant-lock.js'
import { restaurantRepository } from './restaurant-repository.js'
import type {
  CreateLocationInput,
  CreateRestaurantInput,
  FeatureOverridesInput,
  ReplaceDeliveryZonesInput,
  ReplaceOpeningHoursInput,
  ReplaceSpecialHoursInput,
  UpdateLocationInput,
  UpdateRestaurantInput,
} from './restaurant-validation.js'
import { createLocationSchema } from './restaurant-validation.js'

const getUniqueConstraintName = (error: unknown) => {
  let current = error
  for (let depth = 0; depth < 5; depth += 1) {
    if (typeof current !== 'object' || current === null) return undefined
    if ('code' in current && current.code === '23505') {
      return 'constraint' in current && typeof current.constraint === 'string' ? current.constraint : null
    }
    current = 'cause' in current ? current.cause : null
  }
  return undefined
}

const withConflictHandling = async <Result>(operation: () => Promise<Result>): Promise<Result> => {
  try {
    return await operation()
  } catch (error) {
    const constraintName = getUniqueConstraintName(error)
    if (constraintName === 'restaurant_slug_unique') {
      throw new HttpError(409, 'RESTAURANT_IDENTIFIER_CONFLICT', 'This restaurant identifier is already in use.')
    }
    if (constraintName === 'restaurant_location_restaurant_slug_unique') {
      throw new HttpError(409, 'LOCATION_IDENTIFIER_CONFLICT', 'This location identifier is already in use.')
    }
    if (constraintName !== undefined) {
      throw new HttpError(409, 'DUPLICATE_RESOURCE', 'A conflicting record already exists.')
    }
    throw error
  }
}

const requireRestaurant = async (restaurantId: string) => {
  const record = await restaurantRepository.findRestaurantById(restaurantId)
  if (!record) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
  return record
}

const requireLocation = async (restaurantId: string, locationId: string) => {
  const record = await restaurantRepository.findLocation(restaurantId, locationId)
  if (!record) throw new HttpError(404, 'LOCATION_NOT_FOUND', 'Location not found.')
  return record
}

const assertLocationOperationalCapabilitiesAreAvailable = (
  location: Pick<CreateLocationInput, 'deliveryEnabled' | 'pickupEnabled' | 'dineInEnabled' | 'scheduledOrdersEnabled'>,
  effectiveFeatureState: ReadonlyMap<string, boolean>,
) => {
  const restrictedOperationalCapabilities = [
    { enabled: location.deliveryEnabled, featureKey: 'DELIVERY', label: 'Delivery' },
    { enabled: location.pickupEnabled, featureKey: 'PICKUP', label: 'Pickup' },
    { enabled: location.dineInEnabled, featureKey: 'DINE_IN', label: 'Dine-in' },
    { enabled: location.scheduledOrdersEnabled, featureKey: 'SCHEDULED_ORDERS', label: 'Scheduled orders' },
  ].filter(({ enabled, featureKey }) => enabled && !effectiveFeatureState.get(featureKey))

  if (restrictedOperationalCapabilities.length > 0) {
    throw new HttpError(
      403,
      'FEATURE_NOT_AVAILABLE',
      `Unavailable location capabilities are still enabled: ${restrictedOperationalCapabilities.map(({ label }) => label).join(', ')}. Disable them before saving other location changes.`,
    )
  }
}

const assertAllLocationsMatchEffectiveFeatures = (
  locations: Array<
    Pick<CreateLocationInput, 'name' | 'deliveryEnabled' | 'pickupEnabled' | 'dineInEnabled' | 'scheduledOrdersEnabled'>
  >,
  effectiveFeatureState: ReadonlyMap<string, boolean>,
  changeDescription: string,
) => {
  const incompatibleLocations: string[] = []
  for (const location of locations) {
    const unavailableCapabilities = [
      { enabled: location.deliveryEnabled, featureKey: 'DELIVERY', label: 'Delivery' },
      { enabled: location.pickupEnabled, featureKey: 'PICKUP', label: 'Pickup' },
      { enabled: location.dineInEnabled, featureKey: 'DINE_IN', label: 'Dine-in' },
      {
        enabled: location.scheduledOrdersEnabled,
        featureKey: 'SCHEDULED_ORDERS',
        label: 'Scheduled orders',
      },
    ]
      .filter(({ enabled, featureKey }) => enabled && !effectiveFeatureState.get(featureKey))
      .map(({ label }) => label)
    if (unavailableCapabilities.length > 0) {
      incompatibleLocations.push(`${location.name}: ${unavailableCapabilities.join(', ')}`)
    }
  }
  if (incompatibleLocations.length > 0) {
    throw new HttpError(
      409,
      'LOCATION_FEATURE_CONFLICT',
      `${changeDescription} cannot be saved while locations use unavailable capabilities. Disable the listed capabilities first: ${incompatibleLocations.join('; ')}.`,
    )
  }
}

const assertLocationQuotaForExistingLocations = (
  effectiveFeatureState: ReadonlyMap<string, boolean>,
  locationCount: number,
  changeDescription: string,
) => {
  const locationLimit = isFeatureEnabled(effectiveFeatureState, 'MULTI_LOCATION')
    ? multiLocationLimit
    : singleLocationLimit
  if (locationCount <= locationLimit) return

  throw new HttpError(
    409,
    'LOCATION_FEATURE_CONFLICT',
    `${changeDescription} cannot be saved while this restaurant has ${locationCount} locations. The selected package permits ${locationLimit}.`,
  )
}

type EntitlementContext = NonNullable<Awaited<ReturnType<typeof restaurantRepository.loadEntitlementContext>>>

const defaultPrimaryColor = '#D92D20'
const defaultAccentColor = '#F7C948'

const assertRestrictedUsageMatchesEffectiveFeatures = (
  context: EntitlementContext,
  effectiveFeatureState: ReadonlyMap<string, boolean>,
  changeDescription: string,
) => {
  const conflicts: string[] = []
  const usesCustomBranding =
    context.restaurant.logoUrl !== null ||
    context.restaurant.coverImageUrl !== null ||
    context.restaurant.primaryColor.toUpperCase() !== defaultPrimaryColor ||
    context.restaurant.accentColor.toUpperCase() !== defaultAccentColor

  if (usesCustomBranding && !isFeatureEnabled(effectiveFeatureState, 'CUSTOM_BRANDING')) {
    conflicts.push('custom branding')
  }
  if (context.usage.deliveryZoneCount > 0 && !isFeatureEnabled(effectiveFeatureState, 'ADVANCED_DELIVERY_ZONES')) {
    conflicts.push(
      `${context.usage.deliveryZoneCount} delivery zone${context.usage.deliveryZoneCount === 1 ? '' : 's'}`,
    )
  }
  if (context.usage.modifierGroupCount > 0 && !isFeatureEnabled(effectiveFeatureState, 'MENU_CUSTOMIZATIONS')) {
    conflicts.push(
      `${context.usage.modifierGroupCount} modifier group${context.usage.modifierGroupCount === 1 ? '' : 's'}`,
    )
  }
  if (context.usage.labelledItemCount > 0 && !isFeatureEnabled(effectiveFeatureState, 'ALLERGENS_AND_DIETARY_LABELS')) {
    conflicts.push(
      `${context.usage.labelledItemCount} menu item${context.usage.labelledItemCount === 1 ? '' : 's'} with allergen or dietary labels`,
    )
  }

  if (conflicts.length > 0) {
    throw new HttpError(
      409,
      'RESTAURANT_FEATURE_USAGE_CONFLICT',
      `${changeDescription} cannot be saved while restricted capabilities remain configured: ${conflicts.join('; ')}. Remove them first.`,
    )
  }
}

export const restaurantService = {
  listPackages: async () => {
    const rows = await restaurantRepository.listPackages()
    const packages = new Map<
      string,
      { id: string; slug: string; name: string; description: string; sortOrder: number; features: string[] }
    >()
    for (const row of rows) {
      const entry = packages.get(row.id) ?? {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        sortOrder: row.sortOrder,
        features: [],
      }
      if (row.featureKey && row.featureEnabled) entry.features.push(row.featureKey)
      packages.set(row.id, entry)
    }
    return { packages: [...packages.values()], featureKeys: sellableFeatureKeys }
  },

  listRestaurants: () => restaurantRepository.listRestaurants(),

  getRestaurant: async (restaurantId: string) => {
    const details = await restaurantRepository.getRestaurantDetails(restaurantId)
    if (!details) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')

    const effectiveFeatureState = getEffectiveFeatureState(details.packageFeatures, details.overrides)
    const packageDefaults = new Map(details.packageFeatures.map((feature) => [feature.featureKey, feature.enabled]))
    const overrideValues = new Map(details.overrides.map((feature) => [feature.featureKey, feature.enabled]))
    // Every key is reported so callers can still read a retained capability such as DINE_IN,
    // but only sellable keys accept an override. Without this flag the administrator UI renders
    // a control for a feature the API refuses, which fails validation on click.
    const manageableFeatureKeys = new Set<string>(sellableFeatureKeys)
    const effectiveFeatures = featureKeys.map((featureKey) => ({
      featureKey,
      packageEnabled: packageDefaults.get(featureKey) ?? false,
      override: overrideValues.get(featureKey) ?? null,
      enabled: effectiveFeatureState.get(featureKey) ?? false,
      isManageable: manageableFeatureKeys.has(featureKey),
    }))

    return { ...details, effectiveFeatures }
  },

  createRestaurant: async (input: CreateRestaurantInput) => {
    const packageRecord = await restaurantRepository.findActivePackageById(input.packageId)
    if (!packageRecord) throw new HttpError(400, 'INVALID_PACKAGE', 'Select an active subscription package.')
    const enabledPackageFeatures = await restaurantRepository.listEnabledPackageFeatureKeys(input.packageId)
    const effectiveFeatureState = getEffectiveFeatureState(
      enabledPackageFeatures.map(({ featureKey }) => ({ featureKey, enabled: true })),
      [],
    )
    assertLocationOperationalCapabilitiesAreAvailable(input.initialLocation, effectiveFeatureState)
    const usesCustomBranding =
      input.logoUrl !== null ||
      input.coverImageUrl !== null ||
      input.primaryColor.toUpperCase() !== defaultPrimaryColor ||
      input.accentColor.toUpperCase() !== defaultAccentColor
    if (usesCustomBranding) {
      assertFeatureEnabled(effectiveFeatureState, 'CUSTOM_BRANDING', 'configuring custom branding')
    }
    return withConflictHandling(() => restaurantRepository.createRestaurant(input))
  },

  updateRestaurant: async (restaurantId: string, input: UpdateRestaurantInput) => {
    await requireRestaurant(restaurantId)
    const changesBranding =
      input.logoUrl !== undefined ||
      input.coverImageUrl !== undefined ||
      input.primaryColor !== undefined ||
      input.accentColor !== undefined
    // One read serves every check below; the previous code fetched the full detail graph
    // twice when a request changed both the package and the status.
    const details =
      input.packageId || input.status === 'ACTIVE' || changesBranding
        ? await restaurantRepository.getRestaurantDetails(restaurantId)
        : null
    if ((input.packageId || input.status === 'ACTIVE' || changesBranding) && !details) {
      throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
    }
    if (changesBranding && details) {
      assertFeatureEnabled(
        getEffectiveFeatureState(details.packageFeatures, details.overrides),
        'CUSTOM_BRANDING',
        'changing the restaurant logo, cover image or colours',
      )
    }
    if (input.packageId && details) {
      const packageRecord = await restaurantRepository.findActivePackageById(input.packageId)
      if (!packageRecord) throw new HttpError(400, 'INVALID_PACKAGE', 'Select an active subscription package.')
      const packageFeatures = await restaurantRepository.listEnabledPackageFeatureKeys(input.packageId)
      const nextFeatureState = getEffectiveFeatureState(
        packageFeatures.map(({ featureKey }) => ({ featureKey, enabled: true })),
        details.overrides,
      )
      assertAllLocationsMatchEffectiveFeatures(details.locations, nextFeatureState, 'The package change')
      assertLocationQuotaForExistingLocations(nextFeatureState, details.locations.length, 'The package change')
    }
    if (input.status === 'ACTIVE') {
      const activeLocations = details?.locations.filter((location) => location.status === 'ACTIVE') ?? []
      if (activeLocations.length === 0) {
        throw new HttpError(409, 'RESTAURANT_NOT_READY', 'Activate at least one restaurant location before publishing.')
      }
      const openingHours = details?.openingHours ?? []
      const activeLocationMissingHours = activeLocations.some((location) => {
        const configuredTypes = new Set(
          openingHours
            .filter(({ locationId }) => locationId === location.id)
            .map(({ fulfillmentType }) => fulfillmentType),
        )
        return (
          (location.deliveryEnabled && !configuredTypes.has('DELIVERY')) ||
          (location.pickupEnabled && !configuredTypes.has('PICKUP')) ||
          (location.dineInEnabled && !configuredTypes.has('DINE_IN'))
        )
      })
      if (activeLocationMissingHours) {
        throw new HttpError(
          409,
          'RESTAURANT_NOT_READY',
          'Configure opening hours for every active location before publishing.',
        )
      }
    }
    return withConflictHandling(() =>
      withRestaurantConfigurationLock(restaurantId, async (transaction) => {
        // Re-check under the lock: the details read above may predate a concurrent change.
        if (input.packageId || changesBranding) {
          const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
          if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
          if (changesBranding) {
            assertFeatureEnabled(
              getEffectiveFeatureState(context.packageFeatures, context.overrides),
              'CUSTOM_BRANDING',
              'changing the restaurant logo, cover image or colours',
            )
          }
          if (input.packageId) {
            const packageFeatures = await restaurantRepository.listEnabledPackageFeatureKeys(input.packageId)
            const nextFeatureState = getEffectiveFeatureState(
              packageFeatures.map(({ featureKey }) => ({ featureKey, enabled: true })),
              context.overrides,
            )
            assertAllLocationsMatchEffectiveFeatures(context.locations, nextFeatureState, 'The package change')
            assertLocationQuotaForExistingLocations(nextFeatureState, context.locations.length, 'The package change')
            assertRestrictedUsageMatchesEffectiveFeatures(context, nextFeatureState, 'The package change')
          }
        }
        return restaurantRepository.updateRestaurant(restaurantId, input, transaction)
      }),
    )
  },

  createLocation: async (restaurantId: string, input: CreateLocationInput) =>
    withConflictHandling(() =>
      withRestaurantConfigurationLock(restaurantId, async (transaction) => {
        const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
        if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
        const effectiveFeatureState = getEffectiveFeatureState(context.packageFeatures, context.overrides)
        assertLocationOperationalCapabilitiesAreAvailable(input, effectiveFeatureState)
        assertLocationQuota(effectiveFeatureState, context.locations.length)
        return restaurantRepository.createLocation(restaurantId, input, transaction)
      }),
    ),

  updateLocation: async (restaurantId: string, locationId: string, input: UpdateLocationInput) => {
    const current = await requireLocation(restaurantId, locationId)
    // Opening-hour readiness is about this location's own schedule, not the package
    // invariant, so it is read outside the configuration lock.
    const restaurantDetails = await restaurantRepository.getRestaurantDetails(restaurantId)
    if (!restaurantDetails) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
    const completeLocation = createLocationSchema.safeParse({
      name: current.name,
      slug: current.slug,
      status: current.status,
      phone: current.phone,
      email: current.email,
      addressLine1: current.addressLine1,
      addressLine2: current.addressLine2,
      city: current.city,
      province: current.province,
      postalCode: current.postalCode,
      latitude: current.latitude,
      longitude: current.longitude,
      preparationTimeMinutes: current.preparationTimeMinutes,
      orderCapacityPerSlot: current.orderCapacityPerSlot,
      deliveryEnabled: current.deliveryEnabled,
      pickupEnabled: current.pickupEnabled,
      dineInEnabled: current.dineInEnabled,
      scheduledOrdersEnabled: current.scheduledOrdersEnabled,
      minimumOrderAmount: current.minimumOrderAmount,
      deliveryFee: current.deliveryFee,
      freeDeliveryThreshold: current.freeDeliveryThreshold,
      ...input,
    })
    if (!completeLocation.success) {
      throw new HttpError(
        400,
        'INVALID_LOCATION_CONFIGURATION',
        completeLocation.error.issues[0]?.message ?? 'The location configuration is invalid.',
      )
    }
    if (input.status === 'ACTIVE') {
      const enabledFulfillmentTypes = [
        completeLocation.data.deliveryEnabled && 'DELIVERY',
        completeLocation.data.pickupEnabled && 'PICKUP',
        completeLocation.data.dineInEnabled && 'DINE_IN',
      ].filter((fulfillmentType): fulfillmentType is 'DELIVERY' | 'PICKUP' | 'DINE_IN' => Boolean(fulfillmentType))
      const configuredFulfillmentTypes = new Set(
        restaurantDetails.openingHours
          .filter(({ locationId: configuredLocationId }) => configuredLocationId === locationId)
          .map(({ fulfillmentType }) => fulfillmentType),
      )
      if (enabledFulfillmentTypes.some((fulfillmentType) => !configuredFulfillmentTypes.has(fulfillmentType))) {
        throw new HttpError(
          409,
          'LOCATION_NOT_READY',
          'Configure weekly opening hours for every enabled fulfillment method before activating this location.',
        )
      }
    }
    // The capability check and the write share one locked transaction, so a concurrent
    // package or feature-override change cannot slip between them.
    return withConflictHandling(() =>
      withRestaurantConfigurationLock(restaurantId, async (transaction) => {
        const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
        if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
        assertLocationOperationalCapabilitiesAreAvailable(
          completeLocation.data,
          getEffectiveFeatureState(context.packageFeatures, context.overrides),
        )
        return restaurantRepository.updateLocation(restaurantId, locationId, completeLocation.data, transaction)
      }),
    )
  },

  replaceFeatureOverrides: async (restaurantId: string, input: FeatureOverridesInput) => {
    await withRestaurantConfigurationLock(restaurantId, async (transaction) => {
      const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
      if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
      const nextFeatureState = getEffectiveFeatureState(context.packageFeatures, input.overrides)
      assertAllLocationsMatchEffectiveFeatures(context.locations, nextFeatureState, 'The feature-access change')
      assertLocationQuotaForExistingLocations(nextFeatureState, context.locations.length, 'The feature-access change')
      assertRestrictedUsageMatchesEffectiveFeatures(context, nextFeatureState, 'The feature-access change')
      await restaurantRepository.replaceFeatureOverrides(restaurantId, input, transaction)
    })
    return restaurantService.getRestaurant(restaurantId)
  },

  replaceOpeningHours: async (restaurantId: string, locationId: string, input: ReplaceOpeningHoursInput) => {
    const location = await requireLocation(restaurantId, locationId)
    const disabledFulfillmentType = input.hours.find(
      ({ fulfillmentType }) =>
        (fulfillmentType === 'DELIVERY' && !location.deliveryEnabled) ||
        (fulfillmentType === 'PICKUP' && !location.pickupEnabled) ||
        (fulfillmentType === 'DINE_IN' && !location.dineInEnabled),
    )?.fulfillmentType
    if (disabledFulfillmentType) {
      throw new HttpError(
        400,
        'FULFILLMENT_METHOD_DISABLED',
        `Enable ${disabledFulfillmentType.toLowerCase().replace('_', '-')} before configuring its opening hours.`,
      )
    }
    if (location.status === 'ACTIVE') {
      const configuredFulfillmentTypes = new Set(input.hours.map(({ fulfillmentType }) => fulfillmentType))
      if (
        (location.deliveryEnabled && !configuredFulfillmentTypes.has('DELIVERY')) ||
        (location.pickupEnabled && !configuredFulfillmentTypes.has('PICKUP')) ||
        (location.dineInEnabled && !configuredFulfillmentTypes.has('DINE_IN'))
      ) {
        throw new HttpError(
          409,
          'ACTIVE_LOCATION_REQUIRES_HOURS',
          'Every enabled fulfillment method must retain weekly hours while the location is active.',
        )
      }
    }
    await restaurantRepository.replaceOpeningHours(locationId, input)
    return restaurantService.getRestaurant(restaurantId)
  },

  replaceSpecialHours: async (restaurantId: string, locationId: string, input: ReplaceSpecialHoursInput) => {
    const location = await requireLocation(restaurantId, locationId)
    const disabledFulfillmentType = input.specialHours.find(
      ({ fulfillmentType }) =>
        (fulfillmentType === 'DELIVERY' && !location.deliveryEnabled) ||
        (fulfillmentType === 'PICKUP' && !location.pickupEnabled) ||
        (fulfillmentType === 'DINE_IN' && !location.dineInEnabled),
    )?.fulfillmentType
    if (disabledFulfillmentType) {
      throw new HttpError(
        400,
        'FULFILLMENT_METHOD_DISABLED',
        `Enable ${disabledFulfillmentType.toLowerCase().replace('_', '-')} before configuring its special hours.`,
      )
    }
    await restaurantRepository.replaceSpecialHours(locationId, input)
    return restaurantService.getRestaurant(restaurantId)
  },

  replaceDeliveryZones: async (restaurantId: string, locationId: string, input: ReplaceDeliveryZonesInput) => {
    await withRestaurantConfigurationLock(restaurantId, async (transaction) => {
      const location = await restaurantRepository.findLocation(restaurantId, locationId, transaction)
      if (!location) throw new HttpError(404, 'LOCATION_NOT_FOUND', 'Location not found.')
      if (!location.deliveryEnabled && input.deliveryZones.length > 0) {
        throw new HttpError(400, 'DELIVERY_DISABLED', 'Enable delivery before configuring delivery zones.')
      }
      if (input.deliveryZones.length > 0) {
        const context = await restaurantRepository.loadEntitlementContext(restaurantId, transaction)
        if (!context) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')
        assertFeatureEnabled(
          getEffectiveFeatureState(context.packageFeatures, context.overrides),
          'ADVANCED_DELIVERY_ZONES',
          'configuring delivery zones',
        )
      }
      if (input.deliveryZones.some((zone) => zone.type === 'RADIUS') && (!location.latitude || !location.longitude)) {
        throw new HttpError(
          400,
          'LOCATION_COORDINATES_REQUIRED',
          'Add location coordinates before creating a radius delivery zone.',
        )
      }
      await restaurantRepository.replaceDeliveryZones(locationId, input)
    })
    return restaurantService.getRestaurant(restaurantId)
  },
}
