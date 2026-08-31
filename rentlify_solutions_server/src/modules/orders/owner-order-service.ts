import { HttpError } from '../http/http-error.js'
import { orderRepository } from './order-repository.js'

const transitions = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
} as const

type OrderStatus = keyof typeof transitions
type NextOrderStatus = (typeof transitions)[OrderStatus][number]

const isOrderStatus = (value: string): value is OrderStatus => value in transitions

export const ownerOrderService = {
  list: (restaurantId: string, options: { scope: 'ACTIVE' | 'HISTORY'; page: number; pageSize: number }) =>
    orderRepository.listForRestaurant(restaurantId, options),

  summary: (restaurantId: string) => orderRepository.getRestaurantSummary(restaurantId),

  transition: async (
    restaurantId: string,
    orderId: string,
    status: NextOrderStatus,
    changedByUserId: string,
    customerVisibleNote: string | null,
  ) => {
    const current = await orderRepository.findForRestaurant(restaurantId, orderId)
    if (!current) throw new HttpError(404, 'ORDER_NOT_FOUND', 'The order could not be found.')
    if (!isOrderStatus(current.status) || !(transitions[current.status] as readonly string[]).includes(status)) {
      throw new HttpError(409, 'INVALID_ORDER_TRANSITION', 'This order can no longer move to that status.')
    }
    const updated = await orderRepository.transitionStatus(
      restaurantId,
      orderId,
      current.status,
      status,
      changedByUserId,
      customerVisibleNote,
    )
    if (!updated) {
      throw new HttpError(
        409,
        'ORDER_STATUS_CHANGED',
        'The order changed while you were viewing it. Refresh and try again.',
      )
    }
    return updated
  },
}
