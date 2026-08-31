import { z } from 'zod'

const optionalUrl = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .url('Enter a complete HTTPS image URL.')
    .max(2048)
    .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL.'),
])

export const restaurantOwnerProfileFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter at least two characters.').max(120),
    legalName: z.string().trim().max(160),
    description: z.string().trim().max(1000),
    contactEmail: z.string().trim().email('Enter a valid email address.').max(254),
    contactPhone: z
      .string()
      .trim()
      .min(7, 'Enter a valid phone number.')
      .max(30)
      .regex(/^\+?[0-9][0-9 ()-]+$/, 'Enter a valid phone number.'),
    logoUrl: optionalUrl,
    coverImageUrl: optionalUrl,
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a six-digit hex color.'),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Enter a six-digit hex color.'),
  })
  .strict()

export type RestaurantOwnerProfileFormValues = z.infer<typeof restaurantOwnerProfileFormSchema>

type RestaurantOwnerProfileDirtyFields = Partial<Record<keyof RestaurantOwnerProfileFormValues, boolean>>

export const toRestaurantOwnerProfilePayload = (
  values: RestaurantOwnerProfileFormValues,
  dirtyFields: RestaurantOwnerProfileDirtyFields,
) => ({
  ...(dirtyFields.name ? { name: values.name } : {}),
  ...(dirtyFields.legalName ? { legalName: values.legalName || null } : {}),
  ...(dirtyFields.description ? { description: values.description || null } : {}),
  ...(dirtyFields.contactEmail ? { contactEmail: values.contactEmail } : {}),
  ...(dirtyFields.contactPhone ? { contactPhone: values.contactPhone } : {}),
  ...(dirtyFields.logoUrl ? { logoUrl: values.logoUrl || null } : {}),
  ...(dirtyFields.coverImageUrl ? { coverImageUrl: values.coverImageUrl || null } : {}),
  ...(dirtyFields.primaryColor ? { primaryColor: values.primaryColor } : {}),
  ...(dirtyFields.accentColor ? { accentColor: values.accentColor } : {}),
})

export type RestaurantOwnerProfilePayload = ReturnType<typeof toRestaurantOwnerProfilePayload>
