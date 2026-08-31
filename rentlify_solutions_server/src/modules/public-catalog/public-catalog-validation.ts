import { z } from 'zod'

import type { FulfillmentType } from '../restaurants/restaurant-constants.js'

export const publicRestaurantParametersSchema = z
  .object({
    restaurantSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  })
  .strict()

const publicLocationAvailabilitySchema = z
  .object({
    locationId: z.string().min(1),
    menuItemId: z.string().min(1),
    isAvailable: z.boolean(),
    priceOverride: z.number().int().min(0).nullable(),
  })
  .strip()

const publicModifierOptionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    priceAdjustment: z.number().int().min(0),
    sortOrder: z.number().int().min(0),
    isSoldOut: z.boolean(),
  })
  .strip()

const publicModifierGroupSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    minimumSelections: z.number().int().min(0),
    maximumSelections: z.number().int().min(1),
    sortOrder: z.number().int().min(0),
    options: z.array(publicModifierOptionSchema),
  })
  .strip()

const publicMenuItemSchema = z
  .object({
    id: z.string().min(1),
    categoryId: z.string().min(1),
    name: z.string().min(1),
    description: z.string(),
    basePrice: z.number().int().min(0),
    imageUrl: z.url().nullable(),
    dietaryLabels: z.array(z.string()),
    allergens: z.array(z.string()),
    calories: z.number().int().min(0).nullable(),
    preparationTimeMinutes: z.number().int().min(1).nullable(),
    sortOrder: z.number().int().min(0),
    isFeatured: z.boolean(),
    isSoldOut: z.boolean(),
    modifierGroups: z.array(publicModifierGroupSchema),
    locationAvailability: z.array(publicLocationAvailabilitySchema),
  })
  .strip()

export const publishedMenuSnapshotSchema = z
  .object({
    restaurant: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        slug: z.string().min(1),
        currencyCode: z.string().length(3),
        timezone: z.string().min(1),
      })
      .strict(),
    locations: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), slug: z.string().min(1) }).strict()),
    categories: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string().min(1),
          description: z.string().nullable(),
          imageUrl: z.url().nullable(),
          sortOrder: z.number().int().min(0),
          items: z.array(publicMenuItemSchema),
        })
        .strict(),
    ),
    version: z.number().int().min(1),
    publishedAt: z.iso.datetime(),
  })
  .strict()

export type { FulfillmentType }
