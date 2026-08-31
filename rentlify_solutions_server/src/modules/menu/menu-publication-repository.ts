import { asc, desc, eq, inArray, sql } from 'drizzle-orm'

import { database } from '../../database/client.js'
import {
  locationMenuItemAvailability,
  menuCategory,
  menuItem,
  menuItemModifierGroup,
  modifierGroup,
  modifierOption,
  publishedMenu,
  publishedMenuVersion,
  restaurant,
  restaurantLocation,
} from '../../database/schema/platform-schema.js'

export const menuPublicationRepository = {
  getPublicationSource: async (restaurantId: string) =>
    database.transaction(
      async (transaction) => {
        // A PostgreSQL transaction owns one client connection. Keep its queries
        // sequential; pg 9 will reject overlapping client.query() calls.
        const restaurantRecords = await transaction
          .select()
          .from(restaurant)
          .where(eq(restaurant.id, restaurantId))
          .limit(1)
        const categories = await transaction
          .select()
          .from(menuCategory)
          .where(eq(menuCategory.restaurantId, restaurantId))
          .orderBy(asc(menuCategory.sortOrder), asc(menuCategory.name))
        const items = await transaction
          .select()
          .from(menuItem)
          .where(eq(menuItem.restaurantId, restaurantId))
          .orderBy(asc(menuItem.sortOrder), asc(menuItem.name))
        const locations = await transaction
          .select()
          .from(restaurantLocation)
          .where(eq(restaurantLocation.restaurantId, restaurantId))
          .orderBy(asc(restaurantLocation.name))

        const itemIds = items.map(({ id }) => id)
        const modifierLinks =
          itemIds.length === 0
            ? []
            : await transaction
                .select()
                .from(menuItemModifierGroup)
                .where(inArray(menuItemModifierGroup.menuItemId, itemIds))
                .orderBy(asc(menuItemModifierGroup.sortOrder))
        const availability =
          itemIds.length === 0
            ? []
            : await transaction
                .select()
                .from(locationMenuItemAvailability)
                .where(eq(locationMenuItemAvailability.restaurantId, restaurantId))
        const modifierGroupIds = modifierLinks.map(({ modifierGroupId }) => modifierGroupId)
        const modifierGroups =
          modifierGroupIds.length === 0
            ? []
            : await transaction
                .select()
                .from(modifierGroup)
                .where(inArray(modifierGroup.id, modifierGroupIds))
                .orderBy(asc(modifierGroup.sortOrder), asc(modifierGroup.name))
        const modifierOptions =
          modifierGroupIds.length === 0
            ? []
            : await transaction
                .select()
                .from(modifierOption)
                .where(inArray(modifierOption.modifierGroupId, modifierGroupIds))
                .orderBy(asc(modifierOption.sortOrder), asc(modifierOption.name))

        return {
          restaurant: restaurantRecords[0] ?? null,
          categories,
          items,
          locations,
          modifierLinks,
          modifierGroups,
          modifierOptions,
          availability,
        }
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    ),

  getPublicationState: async (restaurantId: string) => {
    const [currentRecords, versions] = await Promise.all([
      database
        .select({ version: publishedMenu.version, publishedAt: publishedMenu.publishedAt })
        .from(publishedMenu)
        .where(eq(publishedMenu.restaurantId, restaurantId))
        .limit(1),
      database
        .select({ version: publishedMenuVersion.version, publishedAt: publishedMenuVersion.publishedAt })
        .from(publishedMenuVersion)
        .where(eq(publishedMenuVersion.restaurantId, restaurantId))
        .orderBy(desc(publishedMenuVersion.version))
        .limit(20),
    ])
    return { currentPublication: currentRecords[0] ?? null, versions }
  },

  publishSnapshot: async (restaurantId: string, snapshot: Record<string, unknown>) =>
    database.transaction(async (transaction) => {
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${restaurantId}))`)
      const [current] = await transaction
        .select({ version: publishedMenu.version })
        .from(publishedMenu)
        .where(eq(publishedMenu.restaurantId, restaurantId))
        .limit(1)
      const version = (current?.version ?? 0) + 1
      const publishedAt = new Date()
      const versionedSnapshot = { ...snapshot, version, publishedAt: publishedAt.toISOString() }

      await transaction.insert(publishedMenuVersion).values({
        restaurantId,
        version,
        snapshot: versionedSnapshot,
        publishedAt,
      })
      await transaction
        .insert(publishedMenu)
        .values({ restaurantId, version, snapshot: versionedSnapshot, publishedAt, updatedAt: publishedAt })
        .onConflictDoUpdate({
          target: publishedMenu.restaurantId,
          set: { version, snapshot: versionedSnapshot, publishedAt, updatedAt: publishedAt },
        })

      return { version, publishedAt }
    }),
}
