import { z } from 'zod'

const optionalText = (maximum: number) => z.string().trim().max(maximum)

export const locationDetailsFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter a location name.').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Enter a location identifier.')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only.'),
  phone: z
    .string()
    .trim()
    .min(7, 'Enter a valid phone number.')
    .max(30)
    .regex(/^\+?[0-9][0-9 ()-]+$/, 'Enter a valid phone number.'),
  email: z.union([z.literal(''), z.string().trim().max(254).email('Enter a valid email address.')]),
  addressLine1: z.string().trim().min(3, 'Enter the street address.').max(160),
  addressLine2: optionalText(160),
  city: z.string().trim().min(2, 'Enter the city.').max(100),
  province: z.string().trim().min(2, 'Enter the province.').max(100),
  postalCode: optionalText(20),
})

export type LocationDetailsFormValues = z.infer<typeof locationDetailsFormSchema>

export const toLocationDetailsPayload = (values: LocationDetailsFormValues) => ({
  ...values,
  email: values.email || null,
  addressLine2: values.addressLine2 || null,
  postalCode: values.postalCode || null,
})

export type LocationDetailsPayload = ReturnType<typeof toLocationDetailsPayload>
