import { z } from 'zod'

export const specialHoursFormSchema = z.object({
  specialHours: z
    .array(
      z
        .object({
          date: z.string().date('Choose a valid date.'),
          fulfillmentType: z.enum(['DELIVERY', 'PICKUP', 'DINE_IN']),
          isClosed: z.boolean(),
          opensAt: z.string().nullable(),
          closesAt: z.string().nullable(),
          reason: z.string().trim().max(160),
        })
        .superRefine((value, context) => {
          if (!value.isClosed && (!value.opensAt || !value.closesAt || value.opensAt === value.closesAt))
            context.addIssue({
              code: 'custom',
              path: ['opensAt'],
              message: 'Choose different opening and closing times.',
            })
        }),
    )
    .max(366),
})

export const deliveryZonesFormSchema = z.object({
  deliveryZones: z
    .array(
      z
        .object({
          name: z.string().trim().min(2, 'Enter a zone name.').max(100),
          type: z.enum(['POSTAL_CODE', 'RADIUS']),
          postalCodesText: z.string(),
          radiusKilometers: z.number().positive().max(200).nullable(),
          deliveryFee: z.number().min(0).max(1_000_000),
          minimumOrderAmount: z.number().min(0).max(1_000_000),
          freeDeliveryThreshold: z.number().min(0).max(1_000_000).nullable(),
          isActive: z.boolean(),
        })
        .superRefine((value, context) => {
          if (value.type === 'POSTAL_CODE' && !value.postalCodesText.trim())
            context.addIssue({ code: 'custom', path: ['postalCodesText'], message: 'Enter at least one postal code.' })
          if (value.type === 'RADIUS' && value.radiusKilometers === null)
            context.addIssue({ code: 'custom', path: ['radiusKilometers'], message: 'Enter a delivery radius.' })
        }),
    )
    .max(100),
})

export type SpecialHoursFormValues = z.infer<typeof specialHoursFormSchema>
export type DeliveryZonesFormValues = z.infer<typeof deliveryZonesFormSchema>

export const toSpecialHoursPayload = (values: SpecialHoursFormValues) => ({
  specialHours: values.specialHours.map((entry) => ({
    ...entry,
    opensAt: entry.isClosed ? null : entry.opensAt,
    closesAt: entry.isClosed ? null : entry.closesAt,
    reason: entry.reason || null,
  })),
})

export const toDeliveryZonesPayload = (values: DeliveryZonesFormValues) => ({
  deliveryZones: values.deliveryZones.map(({ postalCodesText, ...zone }) => ({
    ...zone,
    postalCodes:
      zone.type === 'POSTAL_CODE'
        ? postalCodesText
            .split(',')
            .map((code) => code.trim())
            .filter(Boolean)
        : [],
    radiusKilometers: zone.type === 'RADIUS' ? zone.radiusKilometers : null,
    deliveryFee: Math.round(zone.deliveryFee * 100),
    minimumOrderAmount: Math.round(zone.minimumOrderAmount * 100),
    freeDeliveryThreshold: zone.freeDeliveryThreshold === null ? null : Math.round(zone.freeDeliveryThreshold * 100),
  })),
})

export type SpecialHoursPayload = ReturnType<typeof toSpecialHoursPayload>
export type DeliveryZonesPayload = ReturnType<typeof toDeliveryZonesPayload>
