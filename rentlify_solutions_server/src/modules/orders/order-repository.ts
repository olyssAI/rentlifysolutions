import { randomUUID } from 'node:crypto'
import { and, asc, count, desc, eq, inArray, isNull, max, notInArray, sql } from 'drizzle-orm'

import { database } from '../../database/client.js'
import {
  customerOrder,
  customerOrderItem,
  customerOrderStatusEvent,
  publishedMenu,
  restaurant,
} from '../../database/schema/platform-schema.js'

export class OrderMenuVersionChangedError extends Error {}

type CreateOrderRecord = {
  restaurantId: string
  locationId: string
  customerUserId: string
  customerEmail: string
  idempotencyKey: string
  customerName: string
  customerPhone: string
  fulfillmentType: 'DELIVERY' | 'PICKUP'
  currencyCode: string
  menuVersion: number
  subtotal: number
  deliveryFee: number
  total: number
  deliveryAddress: {
    addressLine1: string
    addressLine2: string | null
    city: string
    province: string
    postalCode: string | null
    instructions: string | null
  } | null
  customerNote: string | null
  lines: ReadonlyArray<{
    menuItemId: string
    itemName: string
    quantity: number
    unitPrice: number
    modifierUnitTotal: number
    lineTotal: number
    modifiers: ReadonlyArray<{ groupName: string; optionName: string; priceAdjustment: number }>
  }>
}

export const orderRepository = {
  create: (record: CreateOrderRecord) =>
    database.transaction(async (transaction) => {
      // Menu publication uses this same restaurant-key lock. Once acquired, the version cannot
      // change between this comparison and the order commit.
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${record.restaurantId}))`)
      const [existing] = await transaction
        .select({
          id: customerOrder.id,
          orderNumber: customerOrder.orderNumber,
          status: customerOrder.status,
          placedAt: customerOrder.placedAt,
        })
        .from(customerOrder)
        .where(
          and(
            eq(customerOrder.restaurantId, record.restaurantId),
            eq(customerOrder.customerUserId, record.customerUserId),
            eq(customerOrder.idempotencyKey, record.idempotencyKey),
          ),
        )
        .limit(1)
      if (existing) return existing
      const [publication] = await transaction
        .select({ version: publishedMenu.version })
        .from(publishedMenu)
        .where(eq(publishedMenu.restaurantId, record.restaurantId))
        .limit(1)
      if (publication?.version !== record.menuVersion) throw new OrderMenuVersionChangedError()
      const [current] = await transaction
        .select({ number: max(customerOrder.orderNumber) })
        .from(customerOrder)
        .where(eq(customerOrder.restaurantId, record.restaurantId))
      const orderId = randomUUID()
      const orderNumber = (current?.number ?? 0) + 1
      const [created] = await transaction
        .insert(customerOrder)
        .values({
          id: orderId,
          restaurantId: record.restaurantId,
          locationId: record.locationId,
          customerUserId: record.customerUserId,
          idempotencyKey: record.idempotencyKey,
          orderNumber,
          fulfillmentType: record.fulfillmentType,
          paymentMethod: 'CASH',
          currencyCode: record.currencyCode,
          menuVersion: record.menuVersion,
          subtotal: record.subtotal,
          deliveryFee: record.deliveryFee,
          total: record.total,
          customerName: record.customerName,
          customerEmail: record.customerEmail,
          customerPhone: record.customerPhone,
          deliveryAddress: record.deliveryAddress,
          customerNote: record.customerNote,
        })
        .returning({
          id: customerOrder.id,
          orderNumber: customerOrder.orderNumber,
          status: customerOrder.status,
          placedAt: customerOrder.placedAt,
        })
      await transaction
        .insert(customerOrderItem)
        .values(record.lines.map((line) => ({ id: randomUUID(), orderId, ...line })))
      await transaction.insert(customerOrderStatusEvent).values({
        id: randomUUID(),
        orderId,
        fromStatus: null,
        toStatus: 'PLACED',
        changedByUserId: record.customerUserId,
      })
      return created
    }),

  listForCustomer: async (customerUserId: string, options: { page: number; pageSize: number }) => {
    const where = and(eq(customerOrder.customerUserId, customerUserId), isNull(customerOrder.archivedAt))
    const [countRow, orders] = await Promise.all([
      database
        .select({ total: count() })
        .from(customerOrder)
        .where(where)
        .then(([row]) => row),
      database
        .select({
          id: customerOrder.id,
          orderNumber: customerOrder.orderNumber,
          restaurantId: customerOrder.restaurantId,
          status: customerOrder.status,
          fulfillmentType: customerOrder.fulfillmentType,
          total: customerOrder.total,
          currencyCode: customerOrder.currencyCode,
          placedAt: customerOrder.placedAt,
        })
        .from(customerOrder)
        .where(where)
        .orderBy(desc(customerOrder.placedAt))
        .limit(options.pageSize)
        .offset((options.page - 1) * options.pageSize),
    ])
    const total = countRow?.total ?? 0
    return {
      orders,
      total,
      page: options.page,
      pageSize: options.pageSize,
      totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
    }
  },

  findForCustomer: async (customerUserId: string, orderId: string) => {
    const [order] = await database
      .select({
        id: customerOrder.id,
        orderNumber: customerOrder.orderNumber,
        restaurantId: customerOrder.restaurantId,
        locationId: customerOrder.locationId,
        status: customerOrder.status,
        fulfillmentType: customerOrder.fulfillmentType,
        paymentMethod: customerOrder.paymentMethod,
        subtotal: customerOrder.subtotal,
        deliveryFee: customerOrder.deliveryFee,
        total: customerOrder.total,
        currencyCode: customerOrder.currencyCode,
        customerName: customerOrder.customerName,
        customerEmail: customerOrder.customerEmail,
        customerPhone: customerOrder.customerPhone,
        deliveryAddress: customerOrder.deliveryAddress,
        customerNote: customerOrder.customerNote,
        placedAt: customerOrder.placedAt,
      })
      .from(customerOrder)
      .where(
        and(
          eq(customerOrder.id, orderId),
          eq(customerOrder.customerUserId, customerUserId),
          isNull(customerOrder.archivedAt),
        ),
      )
      .limit(1)
    if (!order) return null
    const [items, statusEvents] = await Promise.all([
      database
        .select({
          id: customerOrderItem.id,
          itemName: customerOrderItem.itemName,
          quantity: customerOrderItem.quantity,
          unitPrice: customerOrderItem.unitPrice,
          modifierUnitTotal: customerOrderItem.modifierUnitTotal,
          lineTotal: customerOrderItem.lineTotal,
          modifiers: customerOrderItem.modifiers,
        })
        .from(customerOrderItem)
        .where(eq(customerOrderItem.orderId, orderId))
        .orderBy(asc(customerOrderItem.createdAt)),
      database
        .select({
          id: customerOrderStatusEvent.id,
          fromStatus: customerOrderStatusEvent.fromStatus,
          toStatus: customerOrderStatusEvent.toStatus,
          // Named for its audience end to end: whatever an owner writes here is shown to the
          // customer, so no code path can mistake it for an internal remark.
          customerVisibleNote: customerOrderStatusEvent.note,
          createdAt: customerOrderStatusEvent.createdAt,
        })
        .from(customerOrderStatusEvent)
        .where(eq(customerOrderStatusEvent.orderId, orderId))
        .orderBy(asc(customerOrderStatusEvent.createdAt)),
    ])
    return { ...order, items, statusEvents }
  },

  findForRestaurant: async (restaurantId: string, orderId: string) => {
    const [order] = await database
      .select({ id: customerOrder.id, status: customerOrder.status })
      .from(customerOrder)
      .where(
        and(
          eq(customerOrder.id, orderId),
          eq(customerOrder.restaurantId, restaurantId),
          isNull(customerOrder.archivedAt),
        ),
      )
      .limit(1)
    return order ?? null
  },

  listForRestaurant: async (
    restaurantId: string,
    options: { scope: 'ACTIVE' | 'HISTORY'; page: number; pageSize: number },
  ) => {
    const activeStatuses = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY']
    const statusCondition =
      options.scope === 'ACTIVE'
        ? inArray(customerOrder.status, activeStatuses)
        : notInArray(customerOrder.status, activeStatuses)
    const where = and(eq(customerOrder.restaurantId, restaurantId), isNull(customerOrder.archivedAt), statusCondition)
    const [countRow] = await database.select({ total: count() }).from(customerOrder).where(where)
    const total = countRow?.total ?? 0
    const orders = await database
      .select({
        id: customerOrder.id,
        orderNumber: customerOrder.orderNumber,
        status: customerOrder.status,
        fulfillmentType: customerOrder.fulfillmentType,
        paymentMethod: customerOrder.paymentMethod,
        subtotal: customerOrder.subtotal,
        deliveryFee: customerOrder.deliveryFee,
        total: customerOrder.total,
        currencyCode: customerOrder.currencyCode,
        customerName: customerOrder.customerName,
        customerEmail: customerOrder.customerEmail,
        customerPhone: customerOrder.customerPhone,
        deliveryAddress: customerOrder.deliveryAddress,
        customerNote: customerOrder.customerNote,
        locationId: customerOrder.locationId,
        placedAt: customerOrder.placedAt,
      })
      .from(customerOrder)
      .where(where)
      .orderBy(desc(customerOrder.placedAt))
      .limit(options.pageSize)
      .offset((options.page - 1) * options.pageSize)
    if (!orders.length)
      return {
        orders: [],
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
      }
    const items = await database
      .select({
        id: customerOrderItem.id,
        orderId: customerOrderItem.orderId,
        itemName: customerOrderItem.itemName,
        quantity: customerOrderItem.quantity,
        unitPrice: customerOrderItem.unitPrice,
        modifierUnitTotal: customerOrderItem.modifierUnitTotal,
        lineTotal: customerOrderItem.lineTotal,
        modifiers: customerOrderItem.modifiers,
      })
      .from(customerOrderItem)
      .where(
        inArray(
          customerOrderItem.orderId,
          orders.map(({ id }) => id),
        ),
      )
      .orderBy(asc(customerOrderItem.createdAt))
    const itemsByOrder = new Map<string, typeof items>()
    for (const item of items) {
      const orderItems = itemsByOrder.get(item.orderId) ?? []
      orderItems.push(item)
      itemsByOrder.set(item.orderId, orderItems)
    }
    return {
      orders: orders.map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] })),
      total,
      page: options.page,
      pageSize: options.pageSize,
      totalPages: Math.max(1, Math.ceil(total / options.pageSize)),
    }
  },

  getRestaurantSummary: async (restaurantId: string) => {
    // Day buckets must be built in the restaurant's own timezone. `date_trunc` and
    // `current_date` use the database server's timezone, so on a UTC server every order a
    // Karachi restaurant takes between midnight and 05:00 local would be counted against the
    // previous day, and "today" would end five hours early.
    const [restaurantRecord] = await database
      .select({ timezone: restaurant.timezone })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1)
    const timezone = restaurantRecord?.timezone ?? 'UTC'
    const localToday = sql`date_trunc('day', (now() at time zone ${timezone}))`

    const [totals] = await database
      .select({
        totalOrders: count(),
        activeOrders: sql<number>`count(*) filter (where ${customerOrder.status} in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY'))::int`,
        completedValue: sql<number>`coalesce(sum(${customerOrder.total}) filter (where ${customerOrder.status} = 'COMPLETED'), 0)::int`,
        deliveryOrders: sql<number>`count(*) filter (where ${customerOrder.fulfillmentType} = 'DELIVERY')::int`,
        pickupOrders: sql<number>`count(*) filter (where ${customerOrder.fulfillmentType} = 'PICKUP')::int`,
      })
      .from(customerOrder)
      .where(and(eq(customerOrder.restaurantId, restaurantId), isNull(customerOrder.archivedAt)))
    // Compute the local day once in a derived table. Repeating a parameterized timezone
    // expression in SELECT/GROUP BY produces distinct PostgreSQL placeholders, which PostgreSQL
    // does not treat as the same grouping expression even when their values are equal.
    const localOrderDays = database
      .select({
        localDay: sql<Date>`date_trunc('day', (${customerOrder.placedAt} at time zone ${timezone}))`.as('local_day'),
      })
      .from(customerOrder)
      .where(and(eq(customerOrder.restaurantId, restaurantId), isNull(customerOrder.archivedAt)))
      .as('local_order_days')
    const dailyOrders = await database
      .select({
        day: sql<string>`to_char(${localOrderDays.localDay}, 'YYYY-MM-DD')`,
        orders: sql<number>`count(*)::int`,
      })
      .from(localOrderDays)
      .where(sql`${localOrderDays.localDay} >= ${localToday} - interval '6 days'`)
      .groupBy(localOrderDays.localDay)
      .orderBy(localOrderDays.localDay)
    return {
      totalOrders: totals?.totalOrders ?? 0,
      activeOrders: totals?.activeOrders ?? 0,
      completedValue: totals?.completedValue ?? 0,
      deliveryOrders: totals?.deliveryOrders ?? 0,
      pickupOrders: totals?.pickupOrders ?? 0,
      dailyOrders,
    }
  },

  transitionStatus: (
    restaurantId: string,
    orderId: string,
    fromStatus: string,
    toStatus: string,
    changedByUserId: string,
    /** Persisted to `customer_order_status_event.note` and shown on the customer receipt. */
    customerVisibleNote: string | null,
  ) =>
    database.transaction(async (transaction) => {
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${restaurantId}))`)
      const [updated] = await transaction
        .update(customerOrder)
        .set({ status: toStatus, updatedAt: new Date() })
        .where(
          and(
            eq(customerOrder.id, orderId),
            eq(customerOrder.restaurantId, restaurantId),
            eq(customerOrder.status, fromStatus),
            isNull(customerOrder.archivedAt),
          ),
        )
        .returning({ id: customerOrder.id, status: customerOrder.status })
      if (!updated) return null
      await transaction.insert(customerOrderStatusEvent).values({
        id: randomUUID(),
        orderId,
        fromStatus,
        toStatus,
        changedByUserId,
        note: customerVisibleNote,
      })
      return updated
    }),
}
