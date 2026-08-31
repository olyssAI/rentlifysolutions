import { allergens, dietaryLabels } from '@rentlify/authorization-contracts'
import { z } from 'zod'

import { apiRequest as request } from '@/api/api-client'
import type {
  LocationAvailabilityPayload,
  MenuCategoryPayload,
  MenuItemPayload,
} from '@/modules/menu/validation/menu-administration-form-schemas'

const modifierOptionSchema = z.object({
  id: z.string(),
  modifierGroupId: z.string(),
  name: z.string(),
  priceAdjustment: z.number(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  isSoldOut: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
const modifierGroupSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  minimumSelections: z.number(),
  maximumSelections: z.number(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  options: z.array(modifierOptionSchema),
})
const locationAvailabilitySchema = z.object({
  locationId: z.string(),
  menuItemId: z.string(),
  restaurantId: z.string(),
  isAvailable: z.boolean(),
  priceOverride: z.number().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
const categorySchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number(),
  imageUrl: z.string().url().nullable(),
  imagePublicId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
const itemSchema = z.object({
  id: z.string(),
  restaurantId: z.string(),
  categoryId: z.string(),
  name: z.string(),
  description: z.string(),
  basePrice: z.number(),
  imageUrl: z.string().nullable(),
  imagePublicId: z.string().nullable(),
  // Parsed against the shared vocabulary. A value outside it means the database and the
  // application disagree, which should fail loudly rather than render a wrong allergen list.
  dietaryLabels: z.array(z.enum(dietaryLabels)),
  allergens: z.array(z.enum(allergens)),
  calories: z.number().nullable(),
  preparationTimeMinutes: z.number().nullable(),
  sortOrder: z.number(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  isSoldOut: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  modifierGroups: z.array(modifierGroupSchema).default([]),
  locationAvailability: z.array(locationAvailabilitySchema).default([]),
})
const menuSchema = z.object({ categories: z.array(categorySchema), items: z.array(itemSchema) })
const publishedVersionSchema = z.object({ version: z.number().int().positive(), publishedAt: z.coerce.date() })
const publicationStateSchema = z.object({
  readiness: z.object({ ready: z.boolean(), issues: z.array(z.object({ code: z.string(), message: z.string() })) }),
  currentPublication: publishedVersionSchema.nullable(),
  versions: z.array(publishedVersionSchema),
})
const uploadSignatureSchema = z.object({
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int().positive(),
  folder: z.string().min(1),
  publicId: z.string().min(1),
  uploadPreset: z.string().min(1),
  overwrite: z.literal(false),
  signature: z.string().min(1),
  signatureAlgorithm: z.literal('sha256'),
  allowedFormatsParameter: z.literal('jpg,jpeg,png,webp'),
  allowedFormats: z.array(z.string()),
  maximumBytes: z.number().int().positive(),
})
const cloudinaryUploadResponseSchema = z.object({
  secure_url: z.string().url(),
  public_id: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  format: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
})
const menuPath = '/api/owner/menu'

export type MenuCategory = z.infer<typeof categorySchema>
export type MenuItem = z.infer<typeof itemSchema>
export type MenuPublicationState = z.infer<typeof publicationStateSchema>

export const getRestaurantMenuForAdministrator = (restaurantId: string) =>
  request(`/api/admin/restaurants/${encodeURIComponent(restaurantId)}/menu`, menuSchema)

export const createMenuAdministrationApi = () => {
  const basePath = menuPath
  return {
    list: () => request(basePath, menuSchema),
    publication: () => request(`${basePath}/publication`, publicationStateSchema),
    createCategory: (input: MenuCategoryPayload) =>
      request(`${basePath}/categories`, categorySchema, { method: 'POST', body: JSON.stringify(input) }),
    updateCategory: (categoryId: string, input: Partial<MenuCategoryPayload>) =>
      request(`${basePath}/categories/${encodeURIComponent(categoryId)}`, categorySchema, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    createItem: (input: MenuItemPayload) =>
      request(`${basePath}/items`, itemSchema, { method: 'POST', body: JSON.stringify(input) }),
    updateItem: (itemId: string, input: Partial<MenuItemPayload>) =>
      request(`${basePath}/items/${encodeURIComponent(itemId)}`, itemSchema, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    duplicateItem: (itemId: string, input: { name: string }) =>
      request(`${basePath}/items/${encodeURIComponent(itemId)}/duplicate`, itemSchema, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    replaceLocationAvailability: (itemId: string, input: LocationAvailabilityPayload) =>
      request(`${basePath}/items/${encodeURIComponent(itemId)}/availability`, menuSchema, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    publish: () => request(`${basePath}/publication/publish`, publishedVersionSchema, { method: 'POST' }),
    createUploadSignature: () =>
      request(`${basePath}/media/upload-signature`, uploadSignatureSchema, { method: 'POST' }),
    uploadImage: async (file: File, signature: z.infer<typeof uploadSignatureSchema>) => {
      const formData = new FormData()
      formData.set('file', file)
      formData.set('api_key', signature.apiKey)
      formData.set('allowed_formats', signature.allowedFormatsParameter)
      formData.set('timestamp', String(signature.timestamp))
      formData.set('folder', signature.folder)
      formData.set('public_id', signature.publicId)
      formData.set('upload_preset', signature.uploadPreset)
      formData.set('overwrite', 'false')
      formData.set('signature', signature.signature)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: 'POST', body: formData },
      )
      const body: unknown = await response.json().catch(() => null)
      const parsed = cloudinaryUploadResponseSchema.safeParse(body)
      if (!response.ok || !parsed.success) throw new Error('The image upload could not be verified. Please try again.')
      return parsed.data
    },
  }
}

export type MenuAdministrationApi = ReturnType<typeof createMenuAdministrationApi>
