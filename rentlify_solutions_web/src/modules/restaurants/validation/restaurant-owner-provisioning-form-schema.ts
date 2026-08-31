import { z } from 'zod'

export const restaurantOwnerProvisioningFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter the owner’s full name.')
    .max(100, 'Name cannot contain more than 100 characters.'),
  email: z
    .string()
    .trim()
    .max(254, 'Email cannot contain more than 254 characters.')
    .email('Enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  initialPassword: z
    .string()
    .min(12, 'Use at least 12 characters.')
    .max(128, 'Password cannot contain more than 128 characters.')
    .regex(/[a-z]/, 'Include at least one lowercase letter.')
    .regex(/[A-Z]/, 'Include at least one uppercase letter.')
    .regex(/[0-9]/, 'Include at least one number.')
    .regex(/[^A-Za-z0-9]/, 'Include at least one special character.')
    .refine((value) => !/\s/.test(value), 'Password cannot contain spaces.'),
})

export type RestaurantOwnerProvisioningFormValues = z.input<typeof restaurantOwnerProvisioningFormSchema>

export type ProvisionRestaurantOwnerPayload = {
  name: string
  email: string
  password: string
}
