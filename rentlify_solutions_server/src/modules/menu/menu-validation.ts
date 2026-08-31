import { allergens, dietaryLabels } from '@rentlify/authorization-contracts'
import { z } from 'zod'

const identifier = z.string().trim().min(1).max(100)
const name = z.string().trim().min(2).max(120)
const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .nullish()
    .transform((value) => value || null)
const money = z.number().int().min(0).max(100_000_000)

export const menuParametersSchema = z.object({ restaurantId: identifier }).strict()
export const categoryParametersSchema = z.object({ restaurantId: identifier, categoryId: identifier }).strict()
export const itemParametersSchema = z.object({ restaurantId: identifier, itemId: identifier }).strict()
export const mediaSignatureSchema = z.object({ restaurantId: identifier }).strict()

export const createCategorySchema = z
  .object({
    name,
    description: optionalText(500),
    imageUrl: z.string().url().max(2048).nullable(),
    imagePublicId: optionalText(255),
    sortOrder: z.number().int().min(0).max(10_000),
    isActive: z.boolean(),
  })
  .strict()
export const updateCategorySchema = createCategorySchema.partial().refine((value) => Object.keys(value).length > 0)

const optionSchema = z
  .object({
    name,
    priceAdjustment: money,
    sortOrder: z.number().int().min(0).max(10_000),
    isActive: z.boolean(),
    isSoldOut: z.boolean(),
  })
  .strict()

const modifierGroupSchema = z
  .object({
    name,
    minimumSelections: z.number().int().min(0).max(50),
    maximumSelections: z.number().int().min(1).max(50),
    sortOrder: z.number().int().min(0).max(10_000),
    isActive: z.boolean(),
    options: z.array(optionSchema).min(1).max(50),
  })
  .strict()
  .refine((value) => value.minimumSelections <= value.maximumSelections, {
    path: ['minimumSelections'],
    message: 'Minimum selections cannot exceed maximum selections.',
  })
  .refine((value) => value.maximumSelections <= value.options.length, {
    path: ['maximumSelections'],
    message: 'Maximum selections cannot exceed the number of options.',
  })

export const createMenuItemSchema = z
  .object({
    categoryId: identifier,
    name,
    description: z.string().trim().min(3).max(1000),
    basePrice: money,
    imageUrl: z.string().url().max(2048).nullable(),
    imagePublicId: optionalText(255),
    dietaryLabels: z
      .array(z.enum(dietaryLabels))
      .max(dietaryLabels.length)
      .transform((values) => [...new Set(values)]),
    allergens: z
      .array(z.enum(allergens))
      .max(allergens.length)
      .transform((values) => [...new Set(values)]),
    calories: z.number().int().min(0).max(20_000).nullable(),
    preparationTimeMinutes: z.number().int().min(1).max(480).nullable(),
    sortOrder: z.number().int().min(0).max(10_000),
    isActive: z.boolean(),
    isFeatured: z.boolean(),
    isSoldOut: z.boolean(),
    modifierGroups: z.array(modifierGroupSchema).max(15),
  })
  .strict()

export const updateMenuItemSchema = createMenuItemSchema.partial().refine((value) => Object.keys(value).length > 0)

export const availabilitySchema = z
  .object({
    locations: z
      .array(z.object({ locationId: identifier, isAvailable: z.boolean(), priceOverride: money.nullable() }).strict())
      .max(500),
  })
  .strict()
  .superRefine((value, context) => {
    const locationIds = new Set<string>()
    value.locations.forEach(({ locationId }, index) => {
      if (locationIds.has(locationId)) {
        context.addIssue({
          code: 'custom',
          path: ['locations', index, 'locationId'],
          message: 'Each location can appear only once.',
        })
      }
      locationIds.add(locationId)
    })
  })

export const duplicateMenuItemSchema = z
  .object({
    name,
  })
  .strict()

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>
export type AvailabilityInput = z.infer<typeof availabilitySchema>
export type DuplicateMenuItemInput = z.infer<typeof duplicateMenuItemSchema>
