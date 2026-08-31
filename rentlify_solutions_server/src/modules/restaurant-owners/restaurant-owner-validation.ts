import { z } from 'zod'

import { securePasswordSchema } from '../authentication/password-policy.js'

const normalizedEmailSchema = z
  .string()
  .trim()
  .min(3)
  .max(320)
  .email()
  .transform((value) => value.toLowerCase())

export const provisionRestaurantOwnerSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: normalizedEmailSchema,
    password: securePasswordSchema,
  })
  .strict()

export const updateOwnerRestaurantProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    legalName: z.string().trim().max(160).nullable().optional(),
    description: z.string().trim().max(1_000).nullable().optional(),
    contactEmail: normalizedEmailSchema.optional(),
    contactPhone: z
      .string()
      .trim()
      .min(7)
      .max(30)
      .regex(/^\+?[0-9][0-9 ()-]+$/, 'Enter a valid phone number.')
      .optional(),
    logoUrl: z.string().url().max(2_048).startsWith('https://').nullable().optional(),
    coverImageUrl: z.string().url().max(2_048).startsWith('https://').nullable().optional(),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    accentColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' })

export type ProvisionRestaurantOwnerInput = z.infer<typeof provisionRestaurantOwnerSchema>
export type UpdateOwnerRestaurantProfileInput = z.infer<typeof updateOwnerRestaurantProfileSchema>

export const ownerMembershipParametersSchema = z
  .object({
    restaurantId: z.string().trim().min(1).max(100),
    membershipId: z.string().trim().min(1).max(100),
  })
  .strict()
