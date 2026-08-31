import { randomUUID } from 'node:crypto'

import { and, asc, count, eq, inArray } from 'drizzle-orm'

import { database } from '../../database/client.js'

/**
 * Either the pool or an open transaction. Entitlement decisions read and write through one
 * executor so the check and the change cannot straddle a concurrent update.
 */
type Executor = typeof database | Parameters<Parameters<typeof database.transaction>[0]>[0]
import {
  deliveryZone,
  locationOpeningHour,
  locationSpecialHour,
  packageFeature,
  menuItem,
  modifierGroup,
  restaurant,
  restaurantFeatureOverride,
  restaurantLocation,
  subscriptionPackage,
} from '../../database/schema/platform-schema.js'
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

export const restaurantRepository = {
  listPackages: () =>
    database
      .select({
        id: subscriptionPackage.id,
        slug: subscriptionPackage.slug,
        name: subscriptionPackage.name,
        description: subscriptionPackage.description,
        sortOrder: subscriptionPackage.sortOrder,
        featureKey: packageFeature.featureKey,
        featureEnabled: packageFeature.enabled,
      })
      .from(subscriptionPackage)
      .leftJoin(packageFeature, eq(packageFeature.packageId, subscriptionPackage.id))
      .where(eq(subscriptionPackage.isActive, true))
      .orderBy(asc(subscriptionPackage.sortOrder), asc(packageFeature.featureKey)),

  findActivePackageById: async (packageId: string) => {
    const [result] = await database
      .select({ id: subscriptionPackage.id })
      .from(subscriptionPackage)
      .where(and(eq(subscriptionPackage.id, packageId), eq(subscriptionPackage.isActive, true)))
      .limit(1)
    return result ?? null
  },

  listEnabledPackageFeatureKeys: (packageId: string) =>
    database
      .select({ featureKey: packageFeature.featureKey })
      .from(packageFeature)
      .where(and(eq(packageFeature.packageId, packageId), eq(packageFeature.enabled, true))),

  listRestaurants: () =>
    database
      .select({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        packageId: restaurant.packageId,
        packageName: subscriptionPackage.name,
        contactEmail: restaurant.contactEmail,
        primaryColor: restaurant.primaryColor,
        locationCount: count(restaurantLocation.id),
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      })
      .from(restaurant)
      .innerJoin(subscriptionPackage, eq(subscriptionPackage.id, restaurant.packageId))
      .leftJoin(restaurantLocation, eq(restaurantLocation.restaurantId, restaurant.id))
      .groupBy(restaurant.id, subscriptionPackage.id)
      .orderBy(asc(restaurant.name)),

  findRestaurantById: async (restaurantId: string) => {
    const [result] = await database
      .select({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        legalName: restaurant.legalName,
        description: restaurant.description,
        status: restaurant.status,
        packageId: restaurant.packageId,
        packageName: subscriptionPackage.name,
        contactEmail: restaurant.contactEmail,
        contactPhone: restaurant.contactPhone,
        countryCode: restaurant.countryCode,
        currencyCode: restaurant.currencyCode,
        timezone: restaurant.timezone,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        primaryColor: restaurant.primaryColor,
        accentColor: restaurant.accentColor,
        publishedAt: restaurant.publishedAt,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
      })
      .from(restaurant)
      .innerJoin(subscriptionPackage, eq(subscriptionPackage.id, restaurant.packageId))
      .where(eq(restaurant.id, restaurantId))
      .limit(1)
    return result ?? null
  },

  /**
   * The minimum state an entitlement decision needs, read sequentially so it is safe inside a
   * transaction. `getRestaurantDetails` issues its reads in parallel and cannot be reused here:
   * a single pooled connection rejects overlapping queries.
   */
  loadEntitlementContext: async (restaurantId: string, executor: Executor = database) => {
    const [restaurantRecord] = await executor
      .select({
        id: restaurant.id,
        packageId: restaurant.packageId,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        primaryColor: restaurant.primaryColor,
        accentColor: restaurant.accentColor,
      })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1)
    if (!restaurantRecord) return null

    const locations = await executor
      .select({
        id: restaurantLocation.id,
        name: restaurantLocation.name,
        status: restaurantLocation.status,
        deliveryEnabled: restaurantLocation.deliveryEnabled,
        pickupEnabled: restaurantLocation.pickupEnabled,
        dineInEnabled: restaurantLocation.dineInEnabled,
        scheduledOrdersEnabled: restaurantLocation.scheduledOrdersEnabled,
      })
      .from(restaurantLocation)
      .where(eq(restaurantLocation.restaurantId, restaurantId))
      .orderBy(asc(restaurantLocation.name))

    const packageFeatures = await executor
      .select({ featureKey: packageFeature.featureKey, enabled: packageFeature.enabled })
      .from(packageFeature)
      .where(eq(packageFeature.packageId, restaurantRecord.packageId))

    const overrides = await executor
      .select({ featureKey: restaurantFeatureOverride.featureKey, enabled: restaurantFeatureOverride.enabled })
      .from(restaurantFeatureOverride)
      .where(eq(restaurantFeatureOverride.restaurantId, restaurantId))

    const [deliveryZoneUsage] = await executor
      .select({ value: count() })
      .from(deliveryZone)
      .innerJoin(restaurantLocation, eq(restaurantLocation.id, deliveryZone.locationId))
      .where(eq(restaurantLocation.restaurantId, restaurantId))

    const [modifierUsage] = await executor
      .select({ value: count() })
      .from(modifierGroup)
      .where(eq(modifierGroup.restaurantId, restaurantId))

    const menuItems = await executor
      .select({ allergens: menuItem.allergens, dietaryLabels: menuItem.dietaryLabels })
      .from(menuItem)
      .where(eq(menuItem.restaurantId, restaurantId))

    return {
      restaurant: restaurantRecord,
      locations,
      packageFeatures,
      overrides,
      usage: {
        deliveryZoneCount: deliveryZoneUsage?.value ?? 0,
        modifierGroupCount: modifierUsage?.value ?? 0,
        labelledItemCount: menuItems.filter(
          ({ allergens, dietaryLabels }) => allergens.length > 0 || dietaryLabels.length > 0,
        ).length,
      },
    }
  },

  getRestaurantDetails: async (restaurantId: string) => {
    const restaurantRecord = await restaurantRepository.findRestaurantById(restaurantId)
    if (!restaurantRecord) return null

    const restaurantLocationIdentifiers = database
      .select({ id: restaurantLocation.id })
      .from(restaurantLocation)
      .where(eq(restaurantLocation.restaurantId, restaurantId))

    const [locations, packageFeatures, overrides, openingHours, specialHours, deliveryZones] = await Promise.all([
      database
        .select()
        .from(restaurantLocation)
        .where(eq(restaurantLocation.restaurantId, restaurantId))
        .orderBy(asc(restaurantLocation.name)),
      database
        .select({ featureKey: packageFeature.featureKey, enabled: packageFeature.enabled })
        .from(packageFeature)
        .where(eq(packageFeature.packageId, restaurantRecord.packageId))
        .orderBy(asc(packageFeature.featureKey)),
      database
        .select({ featureKey: restaurantFeatureOverride.featureKey, enabled: restaurantFeatureOverride.enabled })
        .from(restaurantFeatureOverride)
        .where(eq(restaurantFeatureOverride.restaurantId, restaurantId))
        .orderBy(asc(restaurantFeatureOverride.featureKey)),
      database
        .select()
        .from(locationOpeningHour)
        .where(inArray(locationOpeningHour.locationId, restaurantLocationIdentifiers))
        .orderBy(
          asc(locationOpeningHour.locationId),
          asc(locationOpeningHour.dayOfWeek),
          asc(locationOpeningHour.fulfillmentType),
          asc(locationOpeningHour.opensAt),
        ),
      database
        .select()
        .from(locationSpecialHour)
        .where(inArray(locationSpecialHour.locationId, restaurantLocationIdentifiers))
        .orderBy(asc(locationSpecialHour.date), asc(locationSpecialHour.fulfillmentType)),
      database
        .select()
        .from(deliveryZone)
        .where(inArray(deliveryZone.locationId, restaurantLocationIdentifiers))
        .orderBy(asc(deliveryZone.name)),
    ])

    return {
      restaurant: restaurantRecord,
      locations,
      packageFeatures,
      overrides,
      openingHours,
      specialHours,
      deliveryZones,
    }
  },

  createRestaurant: (input: CreateRestaurantInput) =>
    database.transaction(async (transaction) => {
      const restaurantId = randomUUID()
      const locationId = randomUUID()
      const [createdRestaurant] = await transaction
        .insert(restaurant)
        .values({
          id: restaurantId,
          name: input.name,
          slug: input.slug,
          legalName: input.legalName,
          description: input.description,
          packageId: input.packageId,
          contactEmail: input.contactEmail,
          contactPhone: input.contactPhone,
          logoUrl: input.logoUrl,
          coverImageUrl: input.coverImageUrl,
          primaryColor: input.primaryColor,
          accentColor: input.accentColor,
        })
        .returning()

      await transaction.insert(restaurantLocation).values({
        id: locationId,
        restaurantId,
        ...input.initialLocation,
      })

      return createdRestaurant
    }),

  updateRestaurant: async (restaurantId: string, input: UpdateRestaurantInput, executor: Executor = database) => {
    const values = {
      ...input,
      ...(input.status === 'ACTIVE' ? { publishedAt: new Date() } : {}),
      ...(input.status === 'DRAFT' ? { publishedAt: null } : {}),
    }
    const [updated] = await executor.update(restaurant).set(values).where(eq(restaurant.id, restaurantId)).returning()
    return updated ?? null
  },

  createLocation: async (restaurantId: string, input: CreateLocationInput, executor: Executor = database) => {
    const [created] = await executor
      .insert(restaurantLocation)
      .values({ id: randomUUID(), restaurantId, ...input })
      .returning()
    return created
  },

  findLocation: async (restaurantId: string, locationId: string, executor: Executor = database) => {
    const [result] = await executor
      .select()
      .from(restaurantLocation)
      .where(and(eq(restaurantLocation.id, locationId), eq(restaurantLocation.restaurantId, restaurantId)))
      .limit(1)
    return result ?? null
  },

  updateLocation: async (
    restaurantId: string,
    locationId: string,
    input: UpdateLocationInput,
    executor: Executor = database,
  ) => {
    const [updated] = await executor
      .update(restaurantLocation)
      .set(input)
      .where(and(eq(restaurantLocation.id, locationId), eq(restaurantLocation.restaurantId, restaurantId)))
      .returning()
    return updated ?? null
  },

  replaceFeatureOverrides: async (
    restaurantId: string,
    input: FeatureOverridesInput,
    executor: Executor = database,
  ) => {
    await executor.delete(restaurantFeatureOverride).where(eq(restaurantFeatureOverride.restaurantId, restaurantId))
    if (input.overrides.length > 0) {
      await executor
        .insert(restaurantFeatureOverride)
        .values(input.overrides.map((override) => ({ restaurantId, ...override })))
    }
  },

  replaceOpeningHours: (locationId: string, input: ReplaceOpeningHoursInput) =>
    database.transaction(async (transaction) => {
      await transaction.delete(locationOpeningHour).where(eq(locationOpeningHour.locationId, locationId))
      if (input.hours.length > 0) {
        await transaction
          .insert(locationOpeningHour)
          .values(input.hours.map((hour) => ({ id: randomUUID(), locationId, ...hour })))
      }
    }),

  replaceSpecialHours: (locationId: string, input: ReplaceSpecialHoursInput) =>
    database.transaction(async (transaction) => {
      await transaction.delete(locationSpecialHour).where(eq(locationSpecialHour.locationId, locationId))
      if (input.specialHours.length > 0) {
        await transaction
          .insert(locationSpecialHour)
          .values(input.specialHours.map((entry) => ({ id: randomUUID(), locationId, ...entry })))
      }
    }),

  replaceDeliveryZones: (locationId: string, input: ReplaceDeliveryZonesInput) =>
    database.transaction(async (transaction) => {
      await transaction.delete(deliveryZone).where(eq(deliveryZone.locationId, locationId))
      if (input.deliveryZones.length > 0) {
        await transaction.insert(deliveryZone).values(
          input.deliveryZones.map((zone) => ({
            id: randomUUID(),
            locationId,
            name: zone.name,
            type: zone.type,
            configuration:
              zone.type === 'POSTAL_CODE'
                ? { postalCodes: zone.postalCodes.map((code) => code.toUpperCase().replace(/\s+/g, '')) }
                : zone.radiusKilometers === null
                  ? {}
                  : { radiusKilometers: zone.radiusKilometers },
            deliveryFee: zone.deliveryFee,
            minimumOrderAmount: zone.minimumOrderAmount,
            freeDeliveryThreshold: zone.freeDeliveryThreshold,
            isActive: zone.isActive,
          })),
        )
      }
    }),
}
