import { z } from 'zod'

import { fulfillmentTypes, locationStatuses, restaurantStatuses, sellableFeatureKeys } from './restaurant-constants.js'

const identifierSchema = z.string().trim().min(1).max(100)
const nameSchema = z.string().trim().min(2).max(120)
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and single hyphens only.')
const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .nullish()
    .transform((value) => value || null)
const phoneSchema = z
  .string()
  .trim()
  .min(7)
  .max(30)
  .regex(/^\+?[0-9][0-9 ()-]+$/, 'Enter a valid phone number.')
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a six-digit hexadecimal color.')
const moneySchema = z.number().int().min(0).max(100_000_000)
const coordinateSchema = z
  .string()
  .trim()
  .regex(/^-?\d{1,3}(?:\.\d{1,6})?$/, 'Use no more than six decimal places.')
  .nullish()
  .transform((value) => value || null)

export const restaurantIdentifierParametersSchema = z.object({ restaurantId: identifierSchema }).strict()
export const locationIdentifierParametersSchema = z
  .object({ restaurantId: identifierSchema, locationId: identifierSchema })
  .strict()

const locationFieldsSchema = z
  .object({
    name: nameSchema,
    slug: slugSchema,
    status: z.enum(locationStatuses).default('DRAFT'),
    phone: phoneSchema,
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .nullish()
      .transform((value) => value || null),
    addressLine1: z.string().trim().min(3).max(160),
    addressLine2: optionalText(160),
    city: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    postalCode: optionalText(20),
    latitude: coordinateSchema,
    longitude: coordinateSchema,
    preparationTimeMinutes: z.number().int().min(1).max(480).default(30),
    orderCapacityPerSlot: z.number().int().min(1).max(10_000).default(20),
    deliveryEnabled: z.boolean().default(true),
    pickupEnabled: z.boolean().default(true),
    dineInEnabled: z.boolean().default(true),
    scheduledOrdersEnabled: z.boolean().default(true),
    minimumOrderAmount: moneySchema.default(0),
    deliveryFee: moneySchema.default(0),
    freeDeliveryThreshold: moneySchema.nullable().default(null),
  })
  .strict()

const validateCompleteLocation = (value: z.infer<typeof locationFieldsSchema>, context: z.RefinementCtx) => {
  if (!value.deliveryEnabled && !value.pickupEnabled && !value.dineInEnabled) {
    context.addIssue({
      code: 'custom',
      path: ['deliveryEnabled'],
      message: 'Enable at least one fulfillment method.',
    })
  }
  if ((value.latitude === null) !== (value.longitude === null)) {
    context.addIssue({
      code: 'custom',
      path: ['latitude'],
      message: 'Latitude and longitude must be provided together.',
    })
  }
  if (value.latitude !== null && Math.abs(Number(value.latitude)) > 90) {
    context.addIssue({ code: 'custom', path: ['latitude'], message: 'Latitude must be between -90 and 90.' })
  }
  if (value.longitude !== null && Math.abs(Number(value.longitude)) > 180) {
    context.addIssue({ code: 'custom', path: ['longitude'], message: 'Longitude must be between -180 and 180.' })
  }
}

export const createLocationSchema = locationFieldsSchema.superRefine(validateCompleteLocation)

export const updateLocationSchema = locationFieldsSchema
  .partial()
  .extend({
    status: z.enum(locationStatuses).optional(),
    preparationTimeMinutes: z.number().int().min(1).max(480).optional(),
    orderCapacityPerSlot: z.number().int().min(1).max(10_000).optional(),
    deliveryEnabled: z.boolean().optional(),
    pickupEnabled: z.boolean().optional(),
    dineInEnabled: z.boolean().optional(),
    scheduledOrdersEnabled: z.boolean().optional(),
    minimumOrderAmount: moneySchema.optional(),
    deliveryFee: moneySchema.optional(),
    freeDeliveryThreshold: moneySchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one location field to update.',
  })

export const createRestaurantSchema = z
  .object({
    name: nameSchema,
    slug: slugSchema,
    legalName: optionalText(160),
    description: optionalText(1000),
    packageId: identifierSchema,
    contactEmail: z.string().trim().max(254).email(),
    contactPhone: phoneSchema,
    logoUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL.')
      .nullish()
      .transform((value) => value || null),
    coverImageUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL.')
      .nullish()
      .transform((value) => value || null),
    primaryColor: colorSchema.default('#D92D20'),
    accentColor: colorSchema.default('#F7C948'),
    initialLocation: createLocationSchema,
  })
  .strict()

export const updateRestaurantSchema = z
  .object({
    name: nameSchema.optional(),
    slug: slugSchema.optional(),
    legalName: optionalText(160).optional(),
    description: optionalText(1000).optional(),
    status: z.enum(restaurantStatuses).optional(),
    packageId: identifierSchema.optional(),
    contactEmail: z.string().trim().max(254).email().optional(),
    contactPhone: phoneSchema.optional(),
    logoUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL.')
      .nullable()
      .optional(),
    coverImageUrl: z
      .string()
      .url()
      .max(2048)
      .refine((value) => value.startsWith('https://'), 'Use an HTTPS image URL.')
      .nullable()
      .optional(),
    primaryColor: colorSchema.optional(),
    accentColor: colorSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one restaurant field to update.' })

export const featureOverridesSchema = z
  .object({
    overrides: z
      .array(z.object({ featureKey: z.enum(sellableFeatureKeys), enabled: z.boolean() }).strict())
      .max(sellableFeatureKeys.length),
  })
  .strict()
  .superRefine(({ overrides }, context) => {
    const seen = new Set<string>()
    for (const [index, override] of overrides.entries()) {
      if (seen.has(override.featureKey)) {
        context.addIssue({
          code: 'custom',
          path: ['overrides', index, 'featureKey'],
          message: 'Each feature may be overridden only once.',
        })
      }
      seen.add(override.featureKey)
    }
  })

const openingHourSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    fulfillmentType: z.enum(fulfillmentTypes),
    opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  })
  .strict()
  .refine(({ opensAt, closesAt }) => opensAt !== closesAt, { message: 'Opening and closing times must differ.' })

export const replaceOpeningHoursSchema = z
  .object({ hours: z.array(openingHourSchema).max(84) })
  .strict()
  .superRefine(({ hours }, context) => {
    const groups = new Map<string, Array<{ opensAt: string; closesAt: string; index: number }>>()
    hours.forEach((hour, index) => {
      const key = `${hour.dayOfWeek}:${hour.fulfillmentType}`
      const entries = groups.get(key) ?? []
      entries.push({ opensAt: hour.opensAt, closesAt: hour.closesAt, index })
      groups.set(key, entries)
    })
    for (const entries of groups.values()) {
      for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
          const previous = entries[leftIndex]
          const current = entries[rightIndex]
          if (previous && current && openingHourRangesOverlap(previous, current)) {
            context.addIssue({
              code: 'custom',
              path: ['hours', current.index],
              message: 'Opening-hour ranges cannot overlap.',
            })
          }
        }
      }
    }
  })

const openingHourRangesOverlap = (
  left: { opensAt: string; closesAt: string },
  right: { opensAt: string; closesAt: string },
) => {
  const toMinutes = (value: string) => {
    const [hours = 0, minutes = 0] = value.split(':').map(Number)
    return hours * 60 + minutes
  }
  const segments = ({ opensAt, closesAt }: { opensAt: string; closesAt: string }): Array<[number, number]> => {
    const opening = toMinutes(opensAt)
    const closing = toMinutes(closesAt)
    return closing > opening
      ? [[opening, closing]]
      : [
          [opening, 1440],
          [0, closing],
        ]
  }
  return segments(left).some(([leftStart, leftEnd]) =>
    segments(right).some(([rightStart, rightEnd]) => leftStart < rightEnd && rightStart < leftEnd),
  )
}

const specialHourSchema = z
  .object({
    date: z.iso.date(),
    fulfillmentType: z.enum(fulfillmentTypes),
    isClosed: z.boolean(),
    opensAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    closesAt: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable(),
    reason: z
      .string()
      .trim()
      .max(160)
      .nullish()
      .transform((value) => value || null),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.isClosed && (value.opensAt !== null || value.closesAt !== null)) {
      context.addIssue({ code: 'custom', path: ['opensAt'], message: 'Closed dates cannot have opening times.' })
    }
    if (!value.isClosed && (value.opensAt === null || value.closesAt === null || value.opensAt === value.closesAt)) {
      context.addIssue({
        code: 'custom',
        path: ['opensAt'],
        message: 'Open dates require different opening and closing times.',
      })
    }
  })

export const replaceSpecialHoursSchema = z
  .object({ specialHours: z.array(specialHourSchema).max(366) })
  .strict()
  .superRefine(({ specialHours }, context) => {
    const seen = new Set<string>()
    specialHours.forEach((entry, index) => {
      const key = `${entry.date}:${entry.fulfillmentType}`
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: ['specialHours', index],
          message: 'Only one exception is allowed per date and fulfillment method.',
        })
      }
      seen.add(key)
    })
  })

const deliveryZoneSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    type: z.enum(['POSTAL_CODE', 'RADIUS']),
    postalCodes: z.array(z.string().trim().min(2).max(20)).max(500).default([]),
    radiusKilometers: z.number().positive().max(200).nullable().default(null),
    deliveryFee: moneySchema,
    minimumOrderAmount: moneySchema,
    freeDeliveryThreshold: moneySchema.nullable(),
    isActive: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.type === 'POSTAL_CODE' && value.postalCodes.length === 0) {
      context.addIssue({ code: 'custom', path: ['postalCodes'], message: 'Add at least one postal code.' })
    }
    if (value.type === 'RADIUS' && value.radiusKilometers === null) {
      context.addIssue({ code: 'custom', path: ['radiusKilometers'], message: 'Enter a delivery radius.' })
    }
    const normalizedCodes = value.postalCodes.map((code) => code.toUpperCase().replace(/\s+/g, ''))
    if (new Set(normalizedCodes).size !== normalizedCodes.length) {
      context.addIssue({ code: 'custom', path: ['postalCodes'], message: 'Postal codes cannot be duplicated.' })
    }
  })

export const replaceDeliveryZonesSchema = z.object({ deliveryZones: z.array(deliveryZoneSchema).max(100) }).strict()

export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>
export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
export type FeatureOverridesInput = z.infer<typeof featureOverridesSchema>
export type ReplaceOpeningHoursInput = z.infer<typeof replaceOpeningHoursSchema>
export type ReplaceSpecialHoursInput = z.infer<typeof replaceSpecialHoursSchema>
export type ReplaceDeliveryZonesInput = z.infer<typeof replaceDeliveryZonesSchema>
