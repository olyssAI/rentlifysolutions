import { randomUUID } from 'node:crypto'

import { and, asc, count, eq, inArray } from 'drizzle-orm'

import { database } from '../../database/client.js'
import {
  locationMenuItemAvailability,
  menuCategory,
  menuItem,
  menuItemModifierGroup,
  modifierGroup,
  modifierOption,
} from '../../database/schema/platform-schema.js'
import type {
  AvailabilityInput,
  CreateCategoryInput,
  CreateMenuItemInput,
  DuplicateMenuItemInput,
  UpdateCategoryInput,
  UpdateMenuItemInput,
} from './menu-validation.js'

const getCreateMenuItemValues = (input: CreateMenuItemInput) => {
  const { modifierGroups, ...menuItemValues } = input
  void modifierGroups
  return menuItemValues
}

const getUpdateMenuItemValues = (input: UpdateMenuItemInput) => {
  const { modifierGroups, ...menuItemValues } = input
  void modifierGroups
  return menuItemValues
}

const insertModifierGroups = async (
  transaction: Parameters<Parameters<typeof database.transaction>[0]>[0],
  restaurantId: string,
  itemId: string,
  groups: CreateMenuItemInput['modifierGroups'],
) => {
  for (const group of groups) {
    const groupId = randomUUID()
    const { options, ...groupValues } = group
    await transaction.insert(modifierGroup).values({ id: groupId, restaurantId, ...groupValues })
    await transaction
      .insert(menuItemModifierGroup)
      .values({ menuItemId: itemId, modifierGroupId: groupId, restaurantId, sortOrder: group.sortOrder })
    await transaction
      .insert(modifierOption)
      .values(options.map((option) => ({ id: randomUUID(), modifierGroupId: groupId, ...option })))
  }
}

const loadMenuItemsWithRelationships = async (restaurantId: string, items: (typeof menuItem.$inferSelect)[]) => {
  if (items.length === 0) return []

  const itemIds = items.map(({ id }) => id)
  const [groupLinks, availabilityRecords] = await Promise.all([
    database
      .select({
        menuItemId: menuItemModifierGroup.menuItemId,
        linkSortOrder: menuItemModifierGroup.sortOrder,
        group: modifierGroup,
      })
      .from(menuItemModifierGroup)
      .innerJoin(
        modifierGroup,
        and(eq(modifierGroup.id, menuItemModifierGroup.modifierGroupId), eq(modifierGroup.restaurantId, restaurantId)),
      )
      .where(
        and(eq(menuItemModifierGroup.restaurantId, restaurantId), inArray(menuItemModifierGroup.menuItemId, itemIds)),
      )
      .orderBy(asc(menuItemModifierGroup.sortOrder), asc(modifierGroup.name)),
    database
      .select()
      .from(locationMenuItemAvailability)
      .where(
        and(
          eq(locationMenuItemAvailability.restaurantId, restaurantId),
          inArray(locationMenuItemAvailability.menuItemId, itemIds),
        ),
      )
      .orderBy(asc(locationMenuItemAvailability.locationId)),
  ])

  const modifierGroupIds = groupLinks.map(({ group }) => group.id)
  const optionRecords =
    modifierGroupIds.length === 0
      ? []
      : await database
          .select()
          .from(modifierOption)
          .where(inArray(modifierOption.modifierGroupId, modifierGroupIds))
          .orderBy(asc(modifierOption.sortOrder), asc(modifierOption.name))

  return items.map((item) => ({
    ...item,
    modifierGroups: groupLinks
      .filter(({ menuItemId }) => menuItemId === item.id)
      .map(({ group, linkSortOrder }) => ({
        ...group,
        sortOrder: linkSortOrder,
        options: optionRecords.filter(({ modifierGroupId }) => modifierGroupId === group.id),
      })),
    locationAvailability: availabilityRecords.filter(({ menuItemId }) => menuItemId === item.id),
  }))
}

const findMenuItemWithRelationships = async (restaurantId: string, itemId: string) => {
  const [record] = await database
    .select()
    .from(menuItem)
    .where(and(eq(menuItem.id, itemId), eq(menuItem.restaurantId, restaurantId)))
    .limit(1)
  if (!record) return null
  const [itemWithRelationships] = await loadMenuItemsWithRelationships(restaurantId, [record])
  return itemWithRelationships ?? null
}

export const menuRepository = {
  countCategories: async (restaurantId: string) => {
    const [result] = await database
      .select({ value: count() })
      .from(menuCategory)
      .where(eq(menuCategory.restaurantId, restaurantId))
    return result?.value ?? 0
  },

  countItems: async (restaurantId: string) => {
    const [result] = await database
      .select({ value: count() })
      .from(menuItem)
      .where(eq(menuItem.restaurantId, restaurantId))
    return result?.value ?? 0
  },

  listMenu: async (restaurantId: string) => {
    const [categories, items] = await Promise.all([
      database
        .select()
        .from(menuCategory)
        .where(eq(menuCategory.restaurantId, restaurantId))
        .orderBy(asc(menuCategory.sortOrder), asc(menuCategory.name)),
      database
        .select()
        .from(menuItem)
        .where(eq(menuItem.restaurantId, restaurantId))
        .orderBy(asc(menuItem.sortOrder), asc(menuItem.name)),
    ])
    return { categories, items: await loadMenuItemsWithRelationships(restaurantId, items) }
  },
  findCategory: async (restaurantId: string, categoryId: string) => {
    const [record] = await database
      .select()
      .from(menuCategory)
      .where(and(eq(menuCategory.id, categoryId), eq(menuCategory.restaurantId, restaurantId)))
      .limit(1)
    return record ?? null
  },
  createCategory: async (restaurantId: string, input: CreateCategoryInput) => {
    const [record] = await database
      .insert(menuCategory)
      .values({ id: randomUUID(), restaurantId, ...input })
      .returning()
    return record
  },
  updateCategory: async (restaurantId: string, categoryId: string, input: UpdateCategoryInput) => {
    const [record] = await database
      .update(menuCategory)
      .set(input)
      .where(and(eq(menuCategory.id, categoryId), eq(menuCategory.restaurantId, restaurantId)))
      .returning()
    return record ?? null
  },
  findItem: async (restaurantId: string, itemId: string) => {
    const [record] = await database
      .select()
      .from(menuItem)
      .where(and(eq(menuItem.id, itemId), eq(menuItem.restaurantId, restaurantId)))
      .limit(1)
    return record ?? null
  },
  findItemWithRelationships: findMenuItemWithRelationships,
  createItem: async (restaurantId: string, input: CreateMenuItemInput) => {
    const createdItemId = await database.transaction(async (transaction) => {
      const itemId = randomUUID()
      const [record] = await transaction
        .insert(menuItem)
        .values({ id: itemId, restaurantId, ...getCreateMenuItemValues(input) })
        .returning()
      await insertModifierGroups(transaction, restaurantId, itemId, input.modifierGroups)
      return record?.id ?? null
    })
    return createdItemId ? findMenuItemWithRelationships(restaurantId, createdItemId) : null
  },
  updateItem: async (restaurantId: string, itemId: string, input: UpdateMenuItemInput) => {
    const updatedItemId = await database.transaction(async (transaction) => {
      const [record] = await transaction
        .update(menuItem)
        .set(getUpdateMenuItemValues(input))
        .where(and(eq(menuItem.id, itemId), eq(menuItem.restaurantId, restaurantId)))
        .returning()
      if (input.modifierGroups) {
        const links = await transaction
          .select({ modifierGroupId: menuItemModifierGroup.modifierGroupId })
          .from(menuItemModifierGroup)
          .where(
            and(eq(menuItemModifierGroup.menuItemId, itemId), eq(menuItemModifierGroup.restaurantId, restaurantId)),
          )
        for (const link of links) {
          // The join table permits a group to serve several items. Editing one item must not
          // delete a group another item still uses, so the link is always removed but the group
          // itself only when this item was its last reference.
          await transaction
            .delete(menuItemModifierGroup)
            .where(
              and(
                eq(menuItemModifierGroup.menuItemId, itemId),
                eq(menuItemModifierGroup.modifierGroupId, link.modifierGroupId),
              ),
            )
          const [remainingLink] = await transaction
            .select({ menuItemId: menuItemModifierGroup.menuItemId })
            .from(menuItemModifierGroup)
            .where(eq(menuItemModifierGroup.modifierGroupId, link.modifierGroupId))
            .limit(1)
          if (!remainingLink) {
            await transaction
              .delete(modifierGroup)
              .where(and(eq(modifierGroup.id, link.modifierGroupId), eq(modifierGroup.restaurantId, restaurantId)))
          }
        }
        await insertModifierGroups(transaction, restaurantId, itemId, input.modifierGroups)
      }
      return record?.id ?? null
    })
    return updatedItemId ? findMenuItemWithRelationships(restaurantId, updatedItemId) : null
  },
  duplicateItem: async (restaurantId: string, itemId: string, input: DuplicateMenuItemInput) => {
    const duplicatedItemId = await database.transaction(async (transaction) => {
      const [sourceItem] = await transaction
        .select()
        .from(menuItem)
        .where(and(eq(menuItem.id, itemId), eq(menuItem.restaurantId, restaurantId)))
        .limit(1)
      if (!sourceItem) return null

      const duplicateId = randomUUID()
      await transaction.insert(menuItem).values({
        id: duplicateId,
        restaurantId,
        categoryId: sourceItem.categoryId,
        name: input.name,
        description: sourceItem.description,
        basePrice: sourceItem.basePrice,
        imageUrl: sourceItem.imageUrl,
        imagePublicId: sourceItem.imagePublicId,
        dietaryLabels: sourceItem.dietaryLabels,
        allergens: sourceItem.allergens,
        calories: sourceItem.calories,
        preparationTimeMinutes: sourceItem.preparationTimeMinutes,
        sortOrder: sourceItem.sortOrder,
        isActive: false,
        isFeatured: false,
        isSoldOut: false,
      })

      const sourceLinks = await transaction
        .select({ group: modifierGroup, sortOrder: menuItemModifierGroup.sortOrder })
        .from(menuItemModifierGroup)
        .innerJoin(
          modifierGroup,
          and(
            eq(modifierGroup.id, menuItemModifierGroup.modifierGroupId),
            eq(modifierGroup.restaurantId, restaurantId),
          ),
        )
        .where(and(eq(menuItemModifierGroup.restaurantId, restaurantId), eq(menuItemModifierGroup.menuItemId, itemId)))
        .orderBy(asc(menuItemModifierGroup.sortOrder))

      for (const { group, sortOrder } of sourceLinks) {
        const duplicateGroupId = randomUUID()
        await transaction.insert(modifierGroup).values({
          id: duplicateGroupId,
          restaurantId,
          name: group.name,
          minimumSelections: group.minimumSelections,
          maximumSelections: group.maximumSelections,
          sortOrder: group.sortOrder,
          isActive: group.isActive,
        })
        await transaction.insert(menuItemModifierGroup).values({
          menuItemId: duplicateId,
          modifierGroupId: duplicateGroupId,
          restaurantId,
          sortOrder,
        })
        const sourceOptions = await transaction
          .select()
          .from(modifierOption)
          .where(eq(modifierOption.modifierGroupId, group.id))
          .orderBy(asc(modifierOption.sortOrder))
        if (sourceOptions.length > 0) {
          await transaction.insert(modifierOption).values(
            sourceOptions.map((option) => ({
              id: randomUUID(),
              modifierGroupId: duplicateGroupId,
              name: option.name,
              priceAdjustment: option.priceAdjustment,
              sortOrder: option.sortOrder,
              isActive: option.isActive,
              isSoldOut: option.isSoldOut,
            })),
          )
        }
      }

      const sourceAvailability = await transaction
        .select()
        .from(locationMenuItemAvailability)
        .where(
          and(
            eq(locationMenuItemAvailability.restaurantId, restaurantId),
            eq(locationMenuItemAvailability.menuItemId, itemId),
          ),
        )
      if (sourceAvailability.length > 0) {
        await transaction.insert(locationMenuItemAvailability).values(
          sourceAvailability.map((availability) => ({
            locationId: availability.locationId,
            menuItemId: duplicateId,
            restaurantId,
            isAvailable: availability.isAvailable,
            priceOverride: availability.priceOverride,
          })),
        )
      }
      return duplicateId
    })

    return duplicatedItemId ? findMenuItemWithRelationships(restaurantId, duplicatedItemId) : null
  },
  replaceAvailability: (restaurantId: string, itemId: string, input: AvailabilityInput) =>
    database.transaction(async (transaction) => {
      await transaction
        .delete(locationMenuItemAvailability)
        .where(
          and(
            eq(locationMenuItemAvailability.restaurantId, restaurantId),
            eq(locationMenuItemAvailability.menuItemId, itemId),
          ),
        )
      if (input.locations.length > 0) {
        await transaction
          .insert(locationMenuItemAvailability)
          .values(input.locations.map((location) => ({ restaurantId, menuItemId: itemId, ...location })))
      }
    }),
}
