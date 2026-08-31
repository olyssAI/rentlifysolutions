import { z } from 'zod'

export const locationOperationalSettingsFormSchema = z
  .object({
    preparationTimeMinutes: z
      .number({ error: 'Enter the preparation time in minutes.' })
      .int('Use a whole number of minutes.')
      .min(1, 'Use at least 1 minute.')
      .max(480, 'Use 480 minutes or less.'),
    orderCapacityPerSlot: z
      .number({ error: 'Enter the number of orders accepted per slot.' })
      .int('Use a whole number of orders.')
      .min(1, 'Accept at least 1 order per slot.')
      .max(10_000, 'Use 10,000 orders or fewer.'),
    deliveryEnabled: z.boolean(),
    pickupEnabled: z.boolean(),
    dineInEnabled: z.boolean(),
    scheduledOrdersEnabled: z.boolean(),
  })
  .superRefine((values, context) => {
    if (!values.deliveryEnabled && !values.pickupEnabled && !values.dineInEnabled) {
      context.addIssue({
        code: 'custom',
        path: ['deliveryEnabled'],
        message: 'Enable at least one fulfillment method.',
      })
    }
  })

export type LocationOperationalSettingsFormValues = z.infer<typeof locationOperationalSettingsFormSchema>
