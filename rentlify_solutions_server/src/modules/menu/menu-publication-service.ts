import { HttpError } from '../http/http-error.js'
import { menuPublicationRepository } from './menu-publication-repository.js'

type PublicationIssue = { code: string; message: string }

const createPublicationSnapshot = async (restaurantId: string) => {
  const source = await menuPublicationRepository.getPublicationSource(restaurantId)
  if (!source.restaurant) throw new HttpError(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.')

  const issues: PublicationIssue[] = []
  const activeLocations = source.locations.filter(({ status }) => status === 'ACTIVE')
  const activeCategories = source.categories.filter(({ isActive }) => isActive)
  const activeCategoryIds = new Set(activeCategories.map(({ id }) => id))
  const activeItems = source.items.filter(({ isActive, categoryId }) => isActive && activeCategoryIds.has(categoryId))

  if (source.restaurant.status !== 'ACTIVE')
    issues.push({ code: 'RESTAURANT_NOT_ACTIVE', message: 'Activate the restaurant before publishing its menu.' })
  if (activeLocations.length === 0)
    issues.push({ code: 'NO_ACTIVE_LOCATION', message: 'Activate at least one location before publishing the menu.' })
  if (activeCategories.length === 0)
    issues.push({ code: 'NO_ACTIVE_CATEGORY', message: 'Add and activate at least one menu category.' })

  for (const category of activeCategories) {
    if (!activeItems.some(({ categoryId }) => categoryId === category.id)) {
      issues.push({
        code: 'EMPTY_ACTIVE_CATEGORY',
        message: `The active category “${category.name}” must contain at least one active item.`,
      })
    }
  }

  const groupsById = new Map(source.modifierGroups.map((group) => [group.id, group]))
  const isActiveModifierGroup = (
    group: (typeof source.modifierGroups)[number] | undefined,
  ): group is (typeof source.modifierGroups)[number] => group?.isActive === true
  for (const item of activeItems) {
    const linkedGroups = source.modifierLinks
      .filter(({ menuItemId }) => menuItemId === item.id)
      .map(({ modifierGroupId }) => groupsById.get(modifierGroupId))
      .filter(isActiveModifierGroup)
    for (const group of linkedGroups) {
      const selectableOptions = source.modifierOptions.filter(
        ({ modifierGroupId, isActive, isSoldOut }) => modifierGroupId === group.id && isActive && !isSoldOut,
      )
      if (!item.isSoldOut && selectableOptions.length < group.minimumSelections) {
        issues.push({
          code: 'REQUIRED_MODIFIER_OPTIONS_UNAVAILABLE',
          message: `“${group.name}” on “${item.name}” needs at least ${group.minimumSelections} available options.`,
        })
      }
    }

    const explicitAvailability = source.availability.filter(({ menuItemId }) => menuItemId === item.id)
    const isAvailableSomewhere = activeLocations.some(({ id: locationId }) => {
      const locationRule = explicitAvailability.find((entry) => entry.locationId === locationId)
      return locationRule?.isAvailable ?? true
    })
    if (activeLocations.length > 0 && !isAvailableSomewhere) {
      issues.push({
        code: 'ITEM_UNAVAILABLE_AT_EVERY_LOCATION',
        message: `“${item.name}” must be available at at least one active location.`,
      })
    }
  }

  const snapshot = {
    restaurant: {
      id: source.restaurant.id,
      name: source.restaurant.name,
      slug: source.restaurant.slug,
      currencyCode: source.restaurant.currencyCode,
      timezone: source.restaurant.timezone,
    },
    locations: activeLocations.map(({ id, name, slug }) => ({ id, name, slug })),
    categories: activeCategories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      items: activeItems
        .filter(({ categoryId }) => categoryId === category.id)
        .map((item) => ({
          ...item,
          modifierGroups: source.modifierLinks
            .filter(({ menuItemId }) => menuItemId === item.id)
            .map((link) => groupsById.get(link.modifierGroupId))
            .filter(isActiveModifierGroup)
            .map((group) => ({
              ...group,
              options: source.modifierOptions.filter(
                ({ modifierGroupId, isActive }) => modifierGroupId === group.id && isActive,
              ),
            })),
          locationAvailability: source.availability.filter(
            ({ menuItemId, locationId }) =>
              menuItemId === item.id && activeLocations.some(({ id }) => id === locationId),
          ),
        })),
    })),
  }

  return { readiness: { ready: issues.length === 0, issues }, snapshot }
}

export const menuPublicationService = {
  getPublicationState: async (restaurantId: string) => {
    const [{ readiness }, state] = await Promise.all([
      createPublicationSnapshot(restaurantId),
      menuPublicationRepository.getPublicationState(restaurantId),
    ])
    return { readiness, ...state }
  },

  publish: async (restaurantId: string) => {
    const { readiness, snapshot } = await createPublicationSnapshot(restaurantId)
    if (!readiness.ready) {
      throw new HttpError(409, 'MENU_NOT_READY', 'Complete the menu readiness requirements before publishing.', {
        issues: readiness.issues,
      })
    }
    return menuPublicationRepository.publishSnapshot(restaurantId, snapshot)
  },
}
