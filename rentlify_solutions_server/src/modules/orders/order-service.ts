import { HttpError } from '../http/http-error.js'
import { publicCatalogService } from '../public-catalog/public-catalog-service.js'
import { assertFeatureEnabled } from '../restaurants/restaurant-entitlements.js'
import { getEffectiveFeatureState } from '../restaurants/restaurant-feature-state.js'
import { restaurantRepository } from '../restaurants/restaurant-repository.js'
import type { CartInput } from './order-validation.js'
import { OrderMenuVersionChangedError, orderRepository } from './order-repository.js'

const validateCart = async (restaurantSlug: string, input: CartInput) => {
  const [bootstrap, menu] = await Promise.all([
    publicCatalogService.getRestaurantBootstrap(restaurantSlug),
    publicCatalogService.getPublishedMenu(restaurantSlug),
  ])
  const entitlementContext = await restaurantRepository.loadEntitlementContext(bootstrap.restaurant.id)
  if (!entitlementContext) throw new HttpError(404, 'RESTAURANT_UNAVAILABLE', 'Restaurant is unavailable.')
  const features = getEffectiveFeatureState(entitlementContext.packageFeatures, entitlementContext.overrides)
  assertFeatureEnabled(features, 'ONLINE_ORDERING', 'customer ordering')
  assertFeatureEnabled(features, 'CUSTOMER_ACCOUNTS', 'customer checkout')
  assertFeatureEnabled(features, 'CASH_ON_DELIVERY', 'cash checkout')
  assertFeatureEnabled(features, input.fulfillmentType, input.fulfillmentType === 'DELIVERY' ? 'delivery' : 'pickup')
  const location = bootstrap.locations.find(({ id }) => id === input.locationId)
  const fulfillment = location?.fulfillment.find(({ type }) => type === input.fulfillmentType)
  if (!location || !fulfillment)
    throw new HttpError(
      409,
      'FULFILLMENT_UNAVAILABLE',
      'The selected fulfillment method is unavailable at this location.',
    )
  if (!fulfillment.isOpenNow)
    throw new HttpError(
      409,
      'LOCATION_CLOSED',
      'The selected location is currently closed for this fulfillment method.',
    )
  const menuItems = new Map(menu.categories.flatMap(({ items }) => items).map((item) => [item.id, item]))
  const lines = input.lines.map((line) => {
    const item = menuItems.get(line.menuItemId)
    const availability = item?.locationAvailability.find(({ locationId }) => locationId === location.id)
    if (!item || item.isSoldOut || !availability?.isAvailable)
      throw new HttpError(409, 'ITEM_UNAVAILABLE', 'One or more cart items are no longer available.')
    const requested = new Set(line.modifierOptionIds)
    const modifiers: Array<{ groupName: string; optionName: string; priceAdjustment: number }> = []
    for (const group of item.modifierGroups) {
      const selected = group.options.filter(({ id }) => requested.has(id))
      if (selected.length < group.minimumSelections || selected.length > group.maximumSelections)
        throw new HttpError(
          400,
          'MODIFIER_SELECTION_INVALID',
          `Choose between ${group.minimumSelections} and ${group.maximumSelections} options for ${group.name}.`,
        )
      for (const option of selected) {
        if (option.isSoldOut)
          throw new HttpError(409, 'MODIFIER_UNAVAILABLE', 'One or more selected options are no longer available.')
        requested.delete(option.id)
        modifiers.push({ groupName: group.name, optionName: option.name, priceAdjustment: option.priceAdjustment })
      }
    }
    if (requested.size)
      throw new HttpError(400, 'MODIFIER_SELECTION_INVALID', 'A selected option does not belong to this product.')
    const unitPrice = availability.priceOverride ?? item.basePrice
    const modifierUnitTotal = modifiers.reduce((total, option) => total + option.priceAdjustment, 0)
    return {
      menuItemId: item.id,
      itemName: item.name,
      quantity: line.quantity,
      unitPrice,
      modifierUnitTotal,
      lineTotal: (unitPrice + modifierUnitTotal) * line.quantity,
      modifiers,
    }
  })
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0)
  if (subtotal < location.minimumOrderAmount)
    throw new HttpError(409, 'MINIMUM_ORDER_NOT_MET', `The minimum order amount is ${location.minimumOrderAmount}.`)
  const deliveryFee =
    input.fulfillmentType === 'DELIVERY' &&
    (location.freeDeliveryThreshold === null || subtotal < location.freeDeliveryThreshold)
      ? location.deliveryFee
      : 0
  return {
    restaurant: bootstrap.restaurant,
    location,
    menuVersion: menu.version,
    lines,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  }
}

const placeOrder = async (
  restaurantSlug: string,
  input: CartInput,
  customer: { id: string; email: string },
  idempotencyKey: string,
) => {
  const validated = await validateCart(restaurantSlug, input)
  const order = await orderRepository
    .create({
      restaurantId: validated.restaurant.id,
      locationId: validated.location.id,
      customerUserId: customer.id,
      idempotencyKey,
      customerEmail: customer.email,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      fulfillmentType: input.fulfillmentType,
      currencyCode: validated.restaurant.currencyCode,
      menuVersion: validated.menuVersion,
      subtotal: validated.subtotal,
      deliveryFee: validated.deliveryFee,
      total: validated.total,
      deliveryAddress: input.deliveryAddress,
      customerNote: input.note,
      lines: validated.lines,
    })
    .catch((error: unknown) => {
      if (error instanceof OrderMenuVersionChangedError)
        throw new HttpError(
          409,
          'MENU_CHANGED',
          'The menu changed while the order was being placed. Review the cart and try again.',
        )
      throw error
    })
  if (!order) throw new HttpError(500, 'ORDER_CREATION_FAILED', 'The order could not be created.')
  return order
}

const getCustomerOrder = async (customerUserId: string, orderId: string) => {
  const order = await orderRepository.findForCustomer(customerUserId, orderId)
  if (!order) throw new HttpError(404, 'ORDER_NOT_FOUND', 'The order could not be found.')
  return order
}

export const orderService = {
  validateCart,
  placeOrder,
  listCustomerOrders: orderRepository.listForCustomer,
  getCustomerOrder,
}
