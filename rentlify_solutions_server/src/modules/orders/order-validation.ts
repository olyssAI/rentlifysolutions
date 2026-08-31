import { z } from 'zod'

const addressSchema = z
  .object({
    addressLine1: z.string().trim().min(3).max(160),
    addressLine2: z.string().trim().max(160).nullable(),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(20).nullable(),
    instructions: z.string().trim().max(300).nullable(),
  })
  .strict()

export const cartInputSchema = z
  .object({
    locationId: z.string().trim().min(1).max(100),
    fulfillmentType: z.enum(['DELIVERY', 'PICKUP']),
    lines: z
      .array(
        z
          .object({
            menuItemId: z.string().trim().min(1).max(100),
            quantity: z.number().int().min(1).max(20),
            modifierOptionIds: z
              .array(z.string().trim().min(1).max(100))
              .max(30)
              .refine((ids) => new Set(ids).size === ids.length, 'Modifier options must be unique.'),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    customer: z.object({ name: z.string().trim().min(2).max(100), phone: z.string().trim().min(7).max(30) }).strict(),
    deliveryAddress: addressSchema.nullable(),
    note: z.string().trim().max(500).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.fulfillmentType === 'DELIVERY' && !value.deliveryAddress)
      context.addIssue({ code: 'custom', path: ['deliveryAddress'], message: 'A delivery address is required.' })
    if (value.fulfillmentType === 'PICKUP' && value.deliveryAddress)
      context.addIssue({
        code: 'custom',
        path: ['deliveryAddress'],
        message: 'Pickup orders cannot include a delivery address.',
      })
  })

export const orderParametersSchema = z
  .object({
    restaurantSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  })
  .strict()
export const customerOrderParametersSchema = z.object({ orderId: z.string().uuid() }).strict()
export const customerOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict()
export const orderIdempotencyHeadersSchema = z.object({ 'idempotency-key': z.string().uuid() }).passthrough()
export type CartInput = z.infer<typeof cartInputSchema>
