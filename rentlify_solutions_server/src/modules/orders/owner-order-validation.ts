import { z } from 'zod'

export const ownerOrderParametersSchema = z.object({ orderId: z.string().uuid() }).strict()

export const ownerOrderListQuerySchema = z
  .object({
    scope: z.enum(['ACTIVE', 'HISTORY']).default('ACTIVE'),
    page: z.coerce.number().int().min(1).max(10_000).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict()

/**
 * `customerVisibleNote` is returned to the customer on their own order receipt. It is named
 * for its audience rather than called `note`, because a field called `note` on a staff screen
 * invites internal remarks. There is no internal-only note field; if one is ever needed it
 * must be a separate column that the customer payload does not select.
 */
export const ownerOrderStatusSchema = z
  .object({
    status: z.enum(['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']),
    customerVisibleNote: z.string().trim().min(1).max(300).nullable().optional(),
  })
  .strict()
