import { allergens, dietaryLabels } from '@rentlify/authorization-contracts'
import { z } from 'zod'

export const menuCategoryFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500),
  sortOrder: z.number().int().min(0).max(10_000),
  isActive: z.boolean(),
  imageUrl: z.string().url().nullable(),
  imagePublicId: z.string().nullable(),
})
export const menuItemFormSchema = z.object({
  categoryId: z.string().min(1, 'Choose a category.'),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(3).max(1000),
  pricePkr: z.number().min(0).max(1_000_000),
  // Closed vocabularies rather than free text: an allergen typed as "penuts" would silently
  // fail to match anything a customer filters on.
  dietaryLabels: z.array(z.enum(dietaryLabels)).max(dietaryLabels.length),
  allergens: z.array(z.enum(allergens)).max(allergens.length),
  calories: z.number().int().min(0).max(20_000).nullable(),
  preparationTimeMinutes: z.number().int().min(1).max(480).nullable(),
  sortOrder: z.number().int().min(0).max(10_000),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isSoldOut: z.boolean(),
  imageUrl: z.string().url().nullable(),
  imagePublicId: z.string().nullable(),
  modifierGroups: z
    .array(
      z
        .object({
          name: z.string().trim().min(2, 'Enter a modifier group name.').max(120),
          minimumSelections: z.number().int().min(0).max(50),
          maximumSelections: z.number().int().min(1).max(50),
          sortOrder: z.number().int().min(0).max(10_000),
          isActive: z.boolean(),
          options: z
            .array(
              z.object({
                name: z.string().trim().min(2, 'Enter an option name.').max(120),
                priceAdjustmentPkr: z.number().min(0).max(1_000_000),
                sortOrder: z.number().int().min(0).max(10_000),
                isActive: z.boolean(),
                isSoldOut: z.boolean(),
              }),
            )
            .min(1, 'Add at least one option.')
            .max(50, 'A modifier group can contain at most 50 options.'),
        })
        .refine((group) => group.minimumSelections <= group.maximumSelections, {
          path: ['minimumSelections'],
          message: 'Minimum selections cannot exceed maximum selections.',
        })
        .refine((group) => group.maximumSelections <= group.options.length, {
          path: ['maximumSelections'],
          message: 'Maximum selections cannot exceed the number of options.',
        }),
    )
    .max(15, 'A menu item can contain at most 15 modifier groups.'),
})
export type MenuCategoryFormValues = z.infer<typeof menuCategoryFormSchema>
export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>
export const duplicateMenuItemFormSchema = z.object({ name: z.string().trim().min(2).max(120) })
export const locationAvailabilityFormSchema = z.object({
  locations: z.array(
    z.object({
      locationId: z.string().min(1),
      isAvailable: z.boolean(),
      priceOverridePkr: z.number().min(0).max(1_000_000).nullable(),
    }),
  ),
})
export type DuplicateMenuItemFormValues = z.infer<typeof duplicateMenuItemFormSchema>
export type LocationAvailabilityFormValues = z.infer<typeof locationAvailabilityFormSchema>
export const toMenuCategoryPayload = (values: MenuCategoryFormValues) => ({
  ...values,
  description: values.description || null,
})
export const toMenuItemPayload = (values: MenuItemFormValues) => ({
  categoryId: values.categoryId,
  name: values.name,
  description: values.description,
  basePrice: Math.round(values.pricePkr * 100),
  imageUrl: values.imageUrl,
  imagePublicId: values.imagePublicId,
  dietaryLabels: [...new Set(values.dietaryLabels)],
  allergens: [...new Set(values.allergens)],
  calories: values.calories,
  preparationTimeMinutes: values.preparationTimeMinutes,
  sortOrder: values.sortOrder,
  isActive: values.isActive,
  isFeatured: values.isFeatured,
  isSoldOut: values.isSoldOut,
  modifierGroups: values.modifierGroups.map((group) => ({
    name: group.name,
    minimumSelections: group.minimumSelections,
    maximumSelections: group.maximumSelections,
    sortOrder: group.sortOrder,
    isActive: group.isActive,
    options: group.options.map((option) => ({
      name: option.name,
      priceAdjustment: Math.round(option.priceAdjustmentPkr * 100),
      sortOrder: option.sortOrder,
      isActive: option.isActive,
      isSoldOut: option.isSoldOut,
    })),
  })),
})

export const toLocationAvailabilityPayload = (values: LocationAvailabilityFormValues) => ({
  locations: values.locations.map((location) => ({
    locationId: location.locationId,
    isAvailable: location.isAvailable,
    priceOverride: location.priceOverridePkr === null ? null : Math.round(location.priceOverridePkr * 100),
  })),
})

export type MenuCategoryPayload = ReturnType<typeof toMenuCategoryPayload>
export type MenuItemPayload = ReturnType<typeof toMenuItemPayload>
export type LocationAvailabilityPayload = ReturnType<typeof toLocationAvailabilityPayload>
