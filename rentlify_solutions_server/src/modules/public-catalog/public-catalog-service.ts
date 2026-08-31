import { HttpError } from '../http/http-error.js'
import { publicCatalogRepository } from './public-catalog-repository.js'
import { publishedMenuSnapshotSchema, type FulfillmentType } from './public-catalog-validation.js'

const publicFulfillmentTypes = ['DELIVERY', 'PICKUP', 'DINE_IN'] as const satisfies readonly FulfillmentType[]

const getLocalClock = (timezone: string, now: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const value = (type: 'weekday' | 'year' | 'month' | 'day' | 'hour' | 'minute') =>
    parts.find((part) => part.type === type)?.value ?? ''
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    dayOfWeek: weekdays.indexOf(value('weekday')),
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  }
}

const previousDate = (date: string) => {
  const value = new Date(`${date}T00:00:00.000Z`)
  value.setUTCDate(value.getUTCDate() - 1)
  return value.toISOString().slice(0, 10)
}

const toMinutes = (value: string) => {
  const [hours = 0, minutes = 0] = value.slice(0, 5).split(':').map(Number)
  return hours * 60 + minutes
}

const isWithinCurrentDateRange = (minutes: number, opensAt: string, closesAt: string) => {
  const opens = toMinutes(opensAt)
  const closes = toMinutes(closesAt)
  return minutes >= opens && (closes <= opens || minutes < closes)
}

const isWithinPreviousOvernightRange = (minutes: number, opensAt: string, closesAt: string) => {
  const opens = toMinutes(opensAt)
  const closes = toMinutes(closesAt)
  return closes <= opens && minutes < closes
}

const loadAvailableRestaurant = async (restaurantSlug: string) => {
  const source = await publicCatalogRepository.findActiveRestaurantBySlug(restaurantSlug)
  if (!source || source.locations.length === 0) {
    throw new HttpError(404, 'RESTAURANT_UNAVAILABLE', 'Restaurant is unavailable.')
  }
  return source
}

export const publicCatalogService = {
  getRestaurantBootstrap: async (restaurantSlug: string, now = new Date()) => {
    const source = await loadAvailableRestaurant(restaurantSlug)
    const clock = getLocalClock(source.restaurant.timezone, now)
    return {
      restaurant: source.restaurant,
      locations: source.locations.map((location) => ({
        ...location,
        fulfillment: publicFulfillmentTypes
          .filter((type) => {
            if (type === 'DELIVERY') return location.deliveryEnabled
            if (type === 'PICKUP') return location.pickupEnabled
            return location.dineInEnabled
          })
          .map((type) => {
            const special = source.specialHours.find(
              (entry) =>
                entry.locationId === location.id && entry.date === clock.date && entry.fulfillmentType === type,
            )
            const previousSpecial = source.specialHours.find(
              (entry) =>
                entry.locationId === location.id &&
                entry.date === previousDate(clock.date) &&
                entry.fulfillmentType === type,
            )
            const regular = source.openingHours.filter(
              (entry) =>
                entry.locationId === location.id &&
                entry.dayOfWeek === clock.dayOfWeek &&
                entry.fulfillmentType === type,
            )
            const previousRegular = source.openingHours.filter(
              (entry) =>
                entry.locationId === location.id &&
                entry.dayOfWeek === (clock.dayOfWeek + 6) % 7 &&
                entry.fulfillmentType === type,
            )
            const isOpenNow = special
              ? !special.isClosed &&
                Boolean(
                  special.opensAt &&
                  special.closesAt &&
                  isWithinCurrentDateRange(clock.minutes, special.opensAt, special.closesAt),
                )
              : previousSpecial && !previousSpecial.isClosed && previousSpecial.opensAt && previousSpecial.closesAt
                ? isWithinPreviousOvernightRange(clock.minutes, previousSpecial.opensAt, previousSpecial.closesAt)
                : regular.some(({ opensAt, closesAt }) => isWithinCurrentDateRange(clock.minutes, opensAt, closesAt)) ||
                  previousRegular.some(({ opensAt, closesAt }) =>
                    isWithinPreviousOvernightRange(clock.minutes, opensAt, closesAt),
                  )
            return { type, isOpenNow }
          }),
      })),
    }
  },

  getPublishedMenu: async (restaurantSlug: string) => {
    const source = await loadAvailableRestaurant(restaurantSlug)
    const storedSnapshot = await publicCatalogRepository.findPublishedMenuByRestaurantId(source.restaurant.id)
    if (!storedSnapshot) throw new HttpError(404, 'MENU_NOT_PUBLISHED', 'The menu is not available yet.')
    const parsedSnapshot = publishedMenuSnapshotSchema.safeParse(storedSnapshot)
    if (!parsedSnapshot.success || parsedSnapshot.data.restaurant.id !== source.restaurant.id) {
      throw new HttpError(503, 'PUBLIC_MENU_INVALID', 'The menu is temporarily unavailable.')
    }
    const activeLocationIds = new Set(source.locations.map(({ id }) => id))
    return {
      ...parsedSnapshot.data,
      locations: parsedSnapshot.data.locations.filter(({ id }) => activeLocationIds.has(id)),
      categories: parsedSnapshot.data.categories.map((category) => ({
        ...category,
        items: category.items.map((item) => ({
          ...item,
          locationAvailability: item.locationAvailability.filter(({ locationId }) => activeLocationIds.has(locationId)),
        })),
      })),
    }
  },
}
