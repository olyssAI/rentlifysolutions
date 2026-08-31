import { and, asc, eq, inArray, isNull } from 'drizzle-orm'

import { database } from '../../database/client.js'
import {
  locationOpeningHour,
  locationSpecialHour,
  publishedMenu,
  restaurant,
  restaurantLocation,
} from '../../database/schema/platform-schema.js'

export const publicCatalogRepository = {
  findActiveRestaurantBySlug: async (slug: string) => {
    const [restaurantRecord] = await database
      .select({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        description: restaurant.description,
        currencyCode: restaurant.currencyCode,
        timezone: restaurant.timezone,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        primaryColor: restaurant.primaryColor,
        accentColor: restaurant.accentColor,
      })
      .from(restaurant)
      .where(and(eq(restaurant.slug, slug), eq(restaurant.status, 'ACTIVE'), isNull(restaurant.archivedAt)))
      .limit(1)
    if (!restaurantRecord) return null

    const locations = await database
      .select({
        id: restaurantLocation.id,
        name: restaurantLocation.name,
        slug: restaurantLocation.slug,
        phone: restaurantLocation.phone,
        addressLine1: restaurantLocation.addressLine1,
        addressLine2: restaurantLocation.addressLine2,
        city: restaurantLocation.city,
        province: restaurantLocation.province,
        postalCode: restaurantLocation.postalCode,
        latitude: restaurantLocation.latitude,
        longitude: restaurantLocation.longitude,
        preparationTimeMinutes: restaurantLocation.preparationTimeMinutes,
        deliveryEnabled: restaurantLocation.deliveryEnabled,
        pickupEnabled: restaurantLocation.pickupEnabled,
        dineInEnabled: restaurantLocation.dineInEnabled,
        scheduledOrdersEnabled: restaurantLocation.scheduledOrdersEnabled,
        minimumOrderAmount: restaurantLocation.minimumOrderAmount,
        deliveryFee: restaurantLocation.deliveryFee,
        freeDeliveryThreshold: restaurantLocation.freeDeliveryThreshold,
      })
      .from(restaurantLocation)
      .where(
        and(
          eq(restaurantLocation.restaurantId, restaurantRecord.id),
          eq(restaurantLocation.status, 'ACTIVE'),
          isNull(restaurantLocation.archivedAt),
        ),
      )
      .orderBy(asc(restaurantLocation.name))

    const locationIds = locations.map(({ id }) => id)
    const openingHours =
      locationIds.length === 0
        ? []
        : await database
            .select({
              locationId: locationOpeningHour.locationId,
              dayOfWeek: locationOpeningHour.dayOfWeek,
              fulfillmentType: locationOpeningHour.fulfillmentType,
              opensAt: locationOpeningHour.opensAt,
              closesAt: locationOpeningHour.closesAt,
            })
            .from(locationOpeningHour)
            .where(inArray(locationOpeningHour.locationId, locationIds))
    const specialHours =
      locationIds.length === 0
        ? []
        : await database
            .select({
              locationId: locationSpecialHour.locationId,
              date: locationSpecialHour.date,
              fulfillmentType: locationSpecialHour.fulfillmentType,
              isClosed: locationSpecialHour.isClosed,
              opensAt: locationSpecialHour.opensAt,
              closesAt: locationSpecialHour.closesAt,
            })
            .from(locationSpecialHour)
            .where(inArray(locationSpecialHour.locationId, locationIds))

    return { restaurant: restaurantRecord, locations, openingHours, specialHours }
  },

  findPublishedMenuByRestaurantId: async (restaurantId: string) => {
    const [result] = await database
      .select({ snapshot: publishedMenu.snapshot })
      .from(publishedMenu)
      .where(eq(publishedMenu.restaurantId, restaurantId))
      .limit(1)
    return result?.snapshot ?? null
  },
}
