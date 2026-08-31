import { z } from 'zod'

export const fulfillmentMethodValues = ['DELIVERY', 'PICKUP', 'DINE_IN'] as const
export type FulfillmentMethodValue = (typeof fulfillmentMethodValues)[number]

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

const openingHourRangeSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  fulfillmentType: z.enum(fulfillmentMethodValues),
  opensAt: z.string().regex(timePattern, 'Choose a valid opening time.'),
  closesAt: z.string().regex(timePattern, 'Choose a valid closing time.'),
})

export const locationWeeklyOpeningHoursFormSchema = z
  .object({ hours: z.array(openingHourRangeSchema).max(84, 'Use no more than 84 weekly time ranges.') })
  .superRefine(({ hours }, context) => {
    hours.forEach((range, index) => {
      if (range.opensAt === range.closesAt) {
        context.addIssue({ code: 'custom', path: ['hours', index, 'closesAt'], message: 'Closing time must differ.' })
      }
    })

    for (let leftIndex = 0; leftIndex < hours.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < hours.length; rightIndex += 1) {
        const left = hours[leftIndex]
        const right = hours[rightIndex]
        if (!left || !right || left.dayOfWeek !== right.dayOfWeek || left.fulfillmentType !== right.fulfillmentType)
          continue
        if (rangesOverlap(left.opensAt, left.closesAt, right.opensAt, right.closesAt)) {
          context.addIssue({
            code: 'custom',
            path: ['hours', rightIndex, 'opensAt'],
            message: 'This time range overlaps another range for the same day.',
          })
        }
      }
    }
  })

export type LocationWeeklyOpeningHoursFormValues = z.infer<typeof locationWeeklyOpeningHoursFormSchema>

const toMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const segments = (opensAt: string, closesAt: string): Array<[number, number]> => {
  const opening = toMinutes(opensAt)
  const closing = toMinutes(closesAt)
  return closing > opening
    ? [[opening, closing]]
    : [
        [opening, 1440],
        [0, closing],
      ]
}

const rangesOverlap = (leftOpen: string, leftClose: string, rightOpen: string, rightClose: string) =>
  segments(leftOpen, leftClose).some(([leftStart, leftEnd]) =>
    segments(rightOpen, rightClose).some(([rightStart, rightEnd]) => leftStart < rightEnd && rightStart < leftEnd),
  )
