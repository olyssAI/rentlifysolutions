import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

import { allergens, dietaryLabels } from '@rentlify/authorization-contracts'

import { user } from './auth-schema.js'

import {
  persistedFeatureKeys,
  fulfillmentTypes,
  locationStatuses,
  restaurantStatuses,
} from '../../modules/restaurants/restaurant-constants.js'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}

export const subscriptionPackage = pgTable('subscription_package', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
})

export const packageFeature = pgTable(
  'package_feature',
  {
    packageId: text('package_id')
      .notNull()
      .references(() => subscriptionPackage.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    enabled: boolean('enabled').default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.packageId, table.featureKey] }),
    check(
      'package_feature_key_check',
      sql`${table.featureKey} in ${sql.raw(`(${persistedFeatureKeys.map((key) => `'${key}'`).join(', ')})`)}`,
    ),
  ],
)

export const restaurant = pgTable(
  'restaurant',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    legalName: text('legal_name'),
    description: text('description'),
    status: text('status').default('DRAFT').notNull(),
    packageId: text('package_id')
      .notNull()
      .references(() => subscriptionPackage.id, { onDelete: 'restrict' }),
    contactEmail: text('contact_email').notNull(),
    contactPhone: text('contact_phone').notNull(),
    countryCode: text('country_code').default('PK').notNull(),
    currencyCode: text('currency_code').default('PKR').notNull(),
    timezone: text('timezone').default('Asia/Karachi').notNull(),
    logoUrl: text('logo_url'),
    coverImageUrl: text('cover_image_url'),
    primaryColor: text('primary_color').default('#D92D20').notNull(),
    accentColor: text('accent_color').default('#F7C948').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('restaurant_slug_unique').on(table.slug),
    index('restaurant_package_id_idx').on(table.packageId),
    index('restaurant_status_idx').on(table.status),
    check(
      'restaurant_status_check',
      sql`${table.status} in ${sql.raw(`(${restaurantStatuses.map((status) => `'${status}'`).join(', ')})`)}`,
    ),
    check('restaurant_primary_color_check', sql`${table.primaryColor} ~ '^#[0-9A-Fa-f]{6}$'`),
    check('restaurant_timezone_check', sql`${table.timezone} = 'Asia/Karachi'`),
    check('restaurant_accent_color_check', sql`${table.accentColor} ~ '^#[0-9A-Fa-f]{6}$'`),
    check('restaurant_logo_url_check', sql`${table.logoUrl} is null or ${table.logoUrl} ~ '^https://'`),
    check(
      'restaurant_cover_image_url_check',
      sql`${table.coverImageUrl} is null or ${table.coverImageUrl} ~ '^https://'`,
    ),
  ],
)

export const restaurantMembership = pgTable(
  'restaurant_membership',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    membershipRole: text('membership_role').default('OWNER').notNull(),
    isPrimary: boolean('is_primary').default(false).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('restaurant_membership_restaurant_user_unique').on(table.restaurantId, table.userId),
    index('restaurant_membership_user_id_idx').on(table.userId),
    index('restaurant_membership_restaurant_id_idx').on(table.restaurantId),
    uniqueIndex('restaurant_membership_one_primary_per_restaurant_unique')
      .on(table.restaurantId)
      .where(sql`${table.isPrimary} = true`),
    check('restaurant_membership_role_check', sql`${table.membershipRole} in ('OWNER')`),
  ],
)

export const restaurantOwnerProvisioning = pgTable(
  'restaurant_owner_provisioning',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    normalizedEmail: text('normalized_email').notNull(),
    createdUserId: text('created_user_id').references(() => user.id, { onDelete: 'set null' }),
    state: text('state').default('PENDING').notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('restaurant_owner_provisioning_restaurant_unique').on(table.restaurantId),
    uniqueIndex('restaurant_owner_provisioning_email_unique').on(table.normalizedEmail),
    check(
      'restaurant_owner_provisioning_email_normalized_check',
      sql`${table.normalizedEmail} = lower(${table.normalizedEmail})`,
    ),
    check('restaurant_owner_provisioning_state_check', sql`${table.state} in ('PENDING', 'COMPLETED')`),
  ],
)

export const restaurantFeatureOverride = pgTable(
  'restaurant_feature_override',
  {
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    featureKey: text('feature_key').notNull(),
    enabled: boolean('enabled').notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.restaurantId, table.featureKey] }),
    check(
      'restaurant_feature_override_key_check',
      sql`${table.featureKey} in ${sql.raw(`(${persistedFeatureKeys.map((key) => `'${key}'`).join(', ')})`)}`,
    ),
  ],
)

export const restaurantLocation = pgTable(
  'restaurant_location',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    status: text('status').default('DRAFT').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    addressLine1: text('address_line_1').notNull(),
    addressLine2: text('address_line_2'),
    city: text('city').notNull(),
    province: text('province').notNull(),
    postalCode: text('postal_code'),
    latitude: numeric('latitude', { precision: 9, scale: 6 }),
    longitude: numeric('longitude', { precision: 10, scale: 6 }),
    preparationTimeMinutes: integer('preparation_time_minutes').default(30).notNull(),
    orderCapacityPerSlot: integer('order_capacity_per_slot').default(20).notNull(),
    deliveryEnabled: boolean('delivery_enabled').default(true).notNull(),
    pickupEnabled: boolean('pickup_enabled').default(true).notNull(),
    dineInEnabled: boolean('dine_in_enabled').default(true).notNull(),
    scheduledOrdersEnabled: boolean('scheduled_orders_enabled').default(true).notNull(),
    minimumOrderAmount: integer('minimum_order_amount').default(0).notNull(),
    deliveryFee: integer('delivery_fee').default(0).notNull(),
    freeDeliveryThreshold: integer('free_delivery_threshold'),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('restaurant_location_restaurant_slug_unique').on(table.restaurantId, table.slug),
    index('restaurant_location_restaurant_id_idx').on(table.restaurantId),
    uniqueIndex('restaurant_location_id_restaurant_unique').on(table.id, table.restaurantId),
    check(
      'restaurant_location_status_check',
      sql`${table.status} in ${sql.raw(`(${locationStatuses.map((status) => `'${status}'`).join(', ')})`)}`,
    ),
    check('restaurant_location_preparation_time_check', sql`${table.preparationTimeMinutes} between 1 and 480`),
    check('restaurant_location_order_capacity_check', sql`${table.orderCapacityPerSlot} between 1 and 10000`),
    check(
      'restaurant_location_money_check',
      sql`${table.minimumOrderAmount} >= 0 and ${table.deliveryFee} >= 0 and (${table.freeDeliveryThreshold} is null or ${table.freeDeliveryThreshold} >= 0)`,
    ),
    check('restaurant_location_latitude_check', sql`${table.latitude} is null or ${table.latitude} between -90 and 90`),
    check(
      'restaurant_location_longitude_check',
      sql`${table.longitude} is null or ${table.longitude} between -180 and 180`,
    ),
  ],
)

export const locationOpeningHour = pgTable(
  'location_opening_hour',
  {
    id: text('id').primaryKey(),
    locationId: text('location_id')
      .notNull()
      .references(() => restaurantLocation.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(),
    fulfillmentType: text('fulfillment_type').notNull(),
    opensAt: time('opens_at', { withTimezone: false }).notNull(),
    closesAt: time('closes_at', { withTimezone: false }).notNull(),
    ...timestamps,
  },
  (table) => [
    index('location_opening_hour_location_id_idx').on(table.locationId),
    // A fulfillment method may have several non-overlapping shifts on one day. The API
    // rejects overlaps; the database prevents duplicate starting points for the same schedule.
    uniqueIndex('location_opening_hour_schedule_unique').on(
      table.locationId,
      table.dayOfWeek,
      table.fulfillmentType,
      table.opensAt,
    ),
    check('location_opening_hour_day_check', sql`${table.dayOfWeek} between 0 and 6`),
    check(
      'location_opening_hour_fulfillment_check',
      sql`${table.fulfillmentType} in ${sql.raw(`(${fulfillmentTypes.map((type) => `'${type}'`).join(', ')})`)}`,
    ),
    check('location_opening_hour_range_check', sql`${table.opensAt} <> ${table.closesAt}`),
  ],
)

export const locationSpecialHour = pgTable(
  'location_special_hour',
  {
    id: text('id').primaryKey(),
    locationId: text('location_id')
      .notNull()
      .references(() => restaurantLocation.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    fulfillmentType: text('fulfillment_type').notNull(),
    isClosed: boolean('is_closed').default(false).notNull(),
    opensAt: time('opens_at', { withTimezone: false }),
    closesAt: time('closes_at', { withTimezone: false }),
    reason: text('reason'),
    ...timestamps,
  },
  (table) => [
    index('location_special_hour_location_id_idx').on(table.locationId),
    uniqueIndex('location_special_hour_schedule_unique').on(table.locationId, table.date, table.fulfillmentType),
    check(
      'location_special_hour_fulfillment_check',
      sql`${table.fulfillmentType} in ${sql.raw(`(${fulfillmentTypes.map((type) => `'${type}'`).join(', ')})`)}`,
    ),
    check(
      'location_special_hour_times_check',
      sql`(${table.isClosed} and ${table.opensAt} is null and ${table.closesAt} is null) or (not ${table.isClosed} and ${table.opensAt} is not null and ${table.closesAt} is not null and ${table.opensAt} <> ${table.closesAt})`,
    ),
  ],
)

export const deliveryZone = pgTable(
  'delivery_zone',
  {
    id: text('id').primaryKey(),
    locationId: text('location_id')
      .notNull()
      .references(() => restaurantLocation.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: text('type').notNull(),
    configuration: jsonb('configuration').$type<{ postalCodes?: string[]; radiusKilometers?: number }>().notNull(),
    deliveryFee: integer('delivery_fee').default(0).notNull(),
    minimumOrderAmount: integer('minimum_order_amount').default(0).notNull(),
    freeDeliveryThreshold: integer('free_delivery_threshold'),
    isActive: boolean('is_active').default(true).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    index('delivery_zone_location_id_idx').on(table.locationId),
    check('delivery_zone_type_check', sql`${table.type} in ('POSTAL_CODE', 'RADIUS')`),
    check(
      'delivery_zone_money_check',
      sql`${table.deliveryFee} >= 0 and ${table.minimumOrderAmount} >= 0 and (${table.freeDeliveryThreshold} is null or ${table.freeDeliveryThreshold} >= 0)`,
    ),
    check(
      'delivery_zone_configuration_check',
      sql`jsonb_typeof(${table.configuration}) = 'object' and ((${table.type} = 'POSTAL_CODE' and jsonb_typeof(${table.configuration}->'postalCodes') = 'array' and jsonb_array_length(${table.configuration}->'postalCodes') > 0) or (${table.type} = 'RADIUS' and jsonb_typeof(${table.configuration}->'radiusKilometers') = 'number' and ((${table.configuration}->>'radiusKilometers')::numeric) > 0 and ((${table.configuration}->>'radiusKilometers')::numeric) <= 200))`,
    ),
  ],
)

export const menuCategory = pgTable(
  'menu_category',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    imagePublicId: text('image_public_id'),
    sortOrder: integer('sort_order').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    index('menu_category_restaurant_id_idx').on(table.restaurantId),
    uniqueIndex('menu_category_restaurant_name_unique').on(table.restaurantId, sql`lower(${table.name})`),
    uniqueIndex('menu_category_id_restaurant_unique').on(table.id, table.restaurantId),
    check('menu_category_sort_order_check', sql`${table.sortOrder} >= 0`),
  ],
)

export const menuItem = pgTable(
  'menu_item',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    categoryId: text('category_id').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    basePrice: integer('base_price').notNull(),
    imageUrl: text('image_url'),
    imagePublicId: text('image_public_id'),
    dietaryLabels: text('dietary_labels')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    allergens: text('allergens')
      .array()
      .default(sql`'{}'::text[]`)
      .notNull(),
    calories: integer('calories'),
    preparationTimeMinutes: integer('preparation_time_minutes'),
    sortOrder: integer('sort_order').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isSoldOut: boolean('is_sold_out').default(false).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    index('menu_item_restaurant_id_idx').on(table.restaurantId),
    index('menu_item_category_id_idx').on(table.categoryId),
    uniqueIndex('menu_item_id_restaurant_unique').on(table.id, table.restaurantId),
    foreignKey({
      columns: [table.categoryId, table.restaurantId],
      foreignColumns: [menuCategory.id, menuCategory.restaurantId],
      name: 'menu_item_category_restaurant_fk',
    }).onDelete('restrict'),
    check('menu_item_price_check', sql`${table.basePrice} >= 0`),
    check('menu_item_sort_order_check', sql`${table.sortOrder} >= 0`),
    check('menu_item_calories_check', sql`${table.calories} is null or ${table.calories} >= 0`),
    // The database refuses values outside the shared vocabulary so a future import path,
    // script, or manual fix cannot introduce an allergen spelling the product cannot match.
    check(
      'menu_item_allergens_check',
      sql`${table.allergens} <@ ${sql.raw(`array[${allergens.map((value) => `'${value}'`).join(', ')}]::text[]`)}`,
    ),
    check(
      'menu_item_dietary_labels_check',
      sql`${table.dietaryLabels} <@ ${sql.raw(`array[${dietaryLabels.map((value) => `'${value}'`).join(', ')}]::text[]`)}`,
    ),
    check(
      'menu_item_preparation_time_check',
      sql`${table.preparationTimeMinutes} is null or ${table.preparationTimeMinutes} between 1 and 480`,
    ),
  ],
)

export const menuMediaUploadIntent = pgTable(
  'menu_media_upload_intent',
  {
    publicId: text('public_id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    requestedByUserId: text('requested_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    attachedAt: timestamp('attached_at', { withTimezone: true }),
    cleanedAt: timestamp('cleaned_at', { withTimezone: true }),
    cleanupAttemptedAt: timestamp('cleanup_attempted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    // Throttling counts signatures for one user within one restaurant over a time window,
    // so the user is part of the key rather than a filter applied after the seek.
    index('menu_media_upload_intent_restaurant_user_created_index').on(
      table.restaurantId,
      table.requestedByUserId,
      table.createdAt,
    ),
    // Cleanup only ever looks at intents that were never attached and never cleaned, which
    // is a small minority of rows. A partial index keeps the range scan on expiresAt cheap
    // instead of indexing every attached upload the job will never read.
    index('menu_media_upload_intent_cleanup_index')
      .on(table.expiresAt)
      .where(sql`${table.attachedAt} is null and ${table.cleanedAt} is null`),
    check(
      'menu_media_upload_intent_state_check',
      sql`not (${table.attachedAt} is not null and ${table.cleanedAt} is not null)`,
    ),
  ],
)

export const modifierGroup = pgTable(
  'modifier_group',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    minimumSelections: integer('minimum_selections').default(0).notNull(),
    maximumSelections: integer('maximum_selections').default(1).notNull(),
    sortOrder: integer('sort_order').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    index('modifier_group_restaurant_id_idx').on(table.restaurantId),
    uniqueIndex('modifier_group_id_restaurant_unique').on(table.id, table.restaurantId),
    check(
      'modifier_group_selection_check',
      sql`${table.minimumSelections} >= 0 and ${table.maximumSelections} >= 1 and ${table.minimumSelections} <= ${table.maximumSelections}`,
    ),
    check('modifier_group_sort_order_check', sql`${table.sortOrder} >= 0`),
  ],
)

export const modifierOption = pgTable(
  'modifier_option',
  {
    id: text('id').primaryKey(),
    modifierGroupId: text('modifier_group_id')
      .notNull()
      .references(() => modifierGroup.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    priceAdjustment: integer('price_adjustment').default(0).notNull(),
    sortOrder: integer('sort_order').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isSoldOut: boolean('is_sold_out').default(false).notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    index('modifier_option_group_id_idx').on(table.modifierGroupId),
    check('modifier_option_price_check', sql`${table.priceAdjustment} >= 0`),
    check('modifier_option_sort_order_check', sql`${table.sortOrder} >= 0`),
  ],
)

export const menuItemModifierGroup = pgTable(
  'menu_item_modifier_group',
  {
    menuItemId: text('menu_item_id')
      .notNull()
      .references(() => menuItem.id, { onDelete: 'cascade' }),
    modifierGroupId: text('modifier_group_id').notNull(),
    restaurantId: text('restaurant_id').notNull(),
    sortOrder: integer('sort_order').notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.menuItemId, table.modifierGroupId] }),
    foreignKey({
      columns: [table.menuItemId, table.restaurantId],
      foreignColumns: [menuItem.id, menuItem.restaurantId],
      name: 'menu_item_modifier_group_item_restaurant_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.modifierGroupId, table.restaurantId],
      foreignColumns: [modifierGroup.id, modifierGroup.restaurantId],
      name: 'menu_item_modifier_group_group_restaurant_fk',
    }).onDelete('cascade'),
    check('menu_item_modifier_group_sort_order_check', sql`${table.sortOrder} >= 0`),
  ],
)

export const locationMenuItemAvailability = pgTable(
  'location_menu_item_availability',
  {
    locationId: text('location_id').notNull(),
    menuItemId: text('menu_item_id').notNull(),
    restaurantId: text('restaurant_id').notNull(),
    isAvailable: boolean('is_available').default(true).notNull(),
    priceOverride: integer('price_override'),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.locationId, table.menuItemId] }),
    foreignKey({
      columns: [table.locationId, table.restaurantId],
      foreignColumns: [restaurantLocation.id, restaurantLocation.restaurantId],
      name: 'location_menu_item_availability_location_restaurant_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.menuItemId, table.restaurantId],
      foreignColumns: [menuItem.id, menuItem.restaurantId],
      name: 'location_menu_item_availability_item_restaurant_fk',
    }).onDelete('cascade'),
    check('location_menu_item_price_check', sql`${table.priceOverride} is null or ${table.priceOverride} >= 0`),
  ],
)

export const publishedMenu = pgTable('published_menu', {
  restaurantId: text('restaurant_id')
    .primaryKey()
    .references(() => restaurant.id, { onDelete: 'cascade' }),
  version: integer('version').default(1).notNull(),
  snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const publishedMenuVersion = pgTable(
  'published_menu_version',
  {
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    snapshot: jsonb('snapshot').$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.restaurantId, table.version] }),
    index('published_menu_version_restaurant_published_at_idx').on(table.restaurantId, table.publishedAt),
    check('published_menu_version_number_check', sql`${table.version} >= 1`),
  ],
)

export const customerOrder = pgTable(
  'customer_order',
  {
    id: text('id').primaryKey(),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurant.id, { onDelete: 'restrict' }),
    locationId: text('location_id').notNull(),
    customerUserId: text('customer_user_id').references(() => user.id, { onDelete: 'set null' }),
    idempotencyKey: text('idempotency_key').notNull(),
    orderNumber: integer('order_number').notNull(),
    status: text('status').default('PLACED').notNull(),
    fulfillmentType: text('fulfillment_type').notNull(),
    paymentMethod: text('payment_method').default('CASH').notNull(),
    currencyCode: text('currency_code').notNull(),
    menuVersion: integer('menu_version').notNull(),
    subtotal: integer('subtotal').notNull(),
    deliveryFee: integer('delivery_fee').default(0).notNull(),
    total: integer('total').notNull(),
    customerName: text('customer_name').notNull(),
    customerEmail: text('customer_email').notNull(),
    customerPhone: text('customer_phone').notNull(),
    deliveryAddress: jsonb('delivery_address').$type<{
      addressLine1: string
      addressLine2: string | null
      city: string
      province: string
      postalCode: string | null
      instructions: string | null
    }>(),
    customerNote: text('customer_note'),
    placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    archivedByUserId: text('archived_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    archiveReason: text('archive_reason'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('customer_order_restaurant_number_unique').on(table.restaurantId, table.orderNumber),
    uniqueIndex('customer_order_restaurant_customer_idempotency_unique').on(
      table.restaurantId,
      table.customerUserId,
      table.idempotencyKey,
    ),
    uniqueIndex('customer_order_id_restaurant_unique').on(table.id, table.restaurantId),
    index('customer_order_customer_placed_at_idx').on(table.customerUserId, table.placedAt),
    index('customer_order_restaurant_status_placed_at_idx').on(table.restaurantId, table.status, table.placedAt),
    foreignKey({
      columns: [table.locationId, table.restaurantId],
      foreignColumns: [restaurantLocation.id, restaurantLocation.restaurantId],
      name: 'customer_order_location_restaurant_fk',
    }).onDelete('restrict'),
    check(
      'customer_order_status_check',
      sql`${table.status} in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')`,
    ),
    check('customer_order_fulfillment_check', sql`${table.fulfillmentType} in ('DELIVERY', 'PICKUP')`),
    check('customer_order_payment_method_check', sql`${table.paymentMethod} = 'CASH'`),
    check('customer_order_currency_check', sql`${table.currencyCode} ~ '^[A-Z]{3}$'`),
    check('customer_order_menu_version_check', sql`${table.menuVersion} >= 1`),
    check('customer_order_number_check', sql`${table.orderNumber} >= 1`),
    check(
      'customer_order_totals_check',
      sql`${table.subtotal} >= 0 and ${table.deliveryFee} >= 0 and ${table.total} = ${table.subtotal} + ${table.deliveryFee}`,
    ),
    check(
      'customer_order_delivery_address_check',
      sql`(${table.fulfillmentType} = 'DELIVERY' and ${table.deliveryAddress} is not null and jsonb_typeof(${table.deliveryAddress}) = 'object') or (${table.fulfillmentType} = 'PICKUP' and ${table.deliveryAddress} is null)`,
    ),
  ],
)

export const customerOrderItem = pgTable(
  'customer_order_item',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrder.id, { onDelete: 'cascade' }),
    menuItemId: text('menu_item_id').references(() => menuItem.id, { onDelete: 'set null' }),
    itemName: text('item_name').notNull(),
    quantity: integer('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    modifierUnitTotal: integer('modifier_unit_total').default(0).notNull(),
    lineTotal: integer('line_total').notNull(),
    modifiers: jsonb('modifiers')
      .$type<ReadonlyArray<{ groupName: string; optionName: string; priceAdjustment: number }>>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index('customer_order_item_order_id_idx').on(table.orderId),
    check('customer_order_item_quantity_check', sql`${table.quantity} between 1 and 50`),
    check(
      'customer_order_item_money_check',
      sql`${table.unitPrice} >= 0 and ${table.modifierUnitTotal} >= 0 and ${table.lineTotal} = (${table.unitPrice} + ${table.modifierUnitTotal}) * ${table.quantity}`,
    ),
    check('customer_order_item_modifiers_check', sql`jsonb_typeof(${table.modifiers}) = 'array'`),
  ],
)

export const customerOrderStatusEvent = pgTable(
  'customer_order_status_event',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => customerOrder.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    changedByUserId: text('changed_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('customer_order_status_event_order_created_idx').on(table.orderId, table.createdAt),
    check(
      'customer_order_status_event_from_check',
      sql`${table.fromStatus} is null or ${table.fromStatus} in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')`,
    ),
    check(
      'customer_order_status_event_to_check',
      sql`${table.toStatus} in ('PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')`,
    ),
  ],
)

/**
 * Database-backed throttling for authenticated application routes.
 *
 * Better Auth limits its own endpoints, but every business route was previously unlimited.
 * A per-process counter would not hold across instances, so the window is stored here and
 * decided under an advisory lock.
 */
export const apiRequestThrottle = pgTable(
  'api_request_throttle',
  {
    throttleKey: text('throttle_key').primaryKey(),
    windowStartedAt: timestamp('window_started_at', { withTimezone: true }).notNull(),
    requestCount: integer('request_count').notNull(),
    ...timestamps,
  },
  (table) => [
    index('api_request_throttle_window_started_at_index').on(table.windowStartedAt),
    check('api_request_throttle_count_check', sql`${table.requestCount} >= 0`),
  ],
)

export const contactEnquiry = pgTable(
  'contact_enquiry',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    businessName: text('business_name').notNull(),
    industry: text('industry').notNull(),
    helpType: text('help_type').notNull(),
    message: text('message').notNull(),
    status: text('status').default('NEW').notNull(),
    ...timestamps,
  },
  (table) => [
    index('contact_enquiry_status_created_at_idx').on(table.status, table.createdAt),
    index('contact_enquiry_email_created_at_idx').on(table.email, table.createdAt),
    check('contact_enquiry_name_length_check', sql`char_length(${table.name}) between 2 and 100`),
    check('contact_enquiry_email_length_check', sql`char_length(${table.email}) between 3 and 254`),
    check('contact_enquiry_email_normalized_check', sql`${table.email} = lower(${table.email})`),
    check(
      'contact_enquiry_phone_length_check',
      sql`${table.phone} is null or char_length(${table.phone}) between 7 and 30`,
    ),
    check('contact_enquiry_business_name_length_check', sql`char_length(${table.businessName}) between 2 and 120`),
    check(
      'contact_enquiry_industry_check',
      sql`${table.industry} in ('RESTAURANT', 'CLINIC', 'GYM', 'ACADEMY', 'RETAIL', 'SALON', 'OTHER')`,
    ),
    check(
      'contact_enquiry_help_type_check',
      sql`${table.helpType} in ('MOBILE_APP', 'WEBSITE', 'BUSINESS_SOFTWARE', 'COMPLETE_SOLUTION', 'NOT_SURE')`,
    ),
    check('contact_enquiry_message_length_check', sql`char_length(${table.message}) between 30 and 2000`),
    check('contact_enquiry_status_check', sql`${table.status} in ('NEW', 'REVIEWED', 'CONTACTED', 'CLOSED')`),
  ],
)
