export const roles = {
  customer: 'CUSTOMER',
  platformUser: 'PLATFORM_USER',
  restaurantOwner: 'RESTAURANT_OWNER',
  superAdministrator: 'SUPER_ADMIN',
} as const

export type Role = (typeof roles)[keyof typeof roles]

export const permissionKeys = {
  platformDashboardRead: 'platform.dashboard.read',
  platformRestaurantsManage: 'platform.restaurants.manage',
  platformOwnersManage: 'platform.owners.manage',
  platformSettingsManage: 'platform.settings.manage',
  restaurantDashboardRead: 'restaurant.dashboard.read',
  restaurantProfileManage: 'restaurant.profile.manage',
  restaurantLocationsManage: 'restaurant.locations.manage',
  restaurantMenuManage: 'restaurant.menu.manage',
  restaurantAccountManage: 'restaurant.account.manage',
} as const

export type PermissionKey = (typeof permissionKeys)[keyof typeof permissionKeys]

const permissionsByRole = {
  [roles.customer]: [],
  [roles.platformUser]: [],
  [roles.restaurantOwner]: [
    permissionKeys.restaurantDashboardRead,
    permissionKeys.restaurantProfileManage,
    permissionKeys.restaurantLocationsManage,
    permissionKeys.restaurantMenuManage,
    permissionKeys.restaurantAccountManage,
  ],
  [roles.superAdministrator]: [
    permissionKeys.platformDashboardRead,
    permissionKeys.platformRestaurantsManage,
    permissionKeys.platformOwnersManage,
    permissionKeys.platformSettingsManage,
  ],
} as const satisfies Record<Role, readonly PermissionKey[]>

export const isRole = (value: unknown): value is Role =>
  typeof value === 'string' && Object.values(roles).some((role) => role === value)

export const permissionsForRole = (role: unknown): readonly PermissionKey[] =>
  isRole(role) ? permissionsByRole[role] : []

export const roleHasPermission = (role: unknown, permission: PermissionKey): boolean =>
  permissionsForRole(role).some((grantedPermission) => grantedPermission === permission)

/**
 * Allergen and dietary vocabularies.
 *
 * These are deliberately closed sets rather than free text. Allergen data is the one field
 * in an ordering product where a spelling variant has physical consequences: "Peanut",
 * "peanuts" and "penuts" must not be three different allergens, and a customer filtering
 * for what they cannot eat must match every item that contains it.
 *
 * Values follow the common regulatory allergen groups. Extend deliberately; removing a value
 * requires migrating existing menu items that reference it.
 */
export const allergens = [
  'CELERY',
  'CRUSTACEANS',
  'EGGS',
  'FISH',
  'GLUTEN',
  'LUPIN',
  'MILK',
  'MOLLUSCS',
  'MUSTARD',
  'NUTS',
  'PEANUTS',
  'SESAME',
  'SOYBEANS',
  'SULPHITES',
] as const

export type Allergen = (typeof allergens)[number]

export const isAllergen = (value: unknown): value is Allergen =>
  typeof value === 'string' && (allergens as readonly string[]).includes(value)

export const dietaryLabels = [
  'VEGETARIAN',
  'VEGAN',
  'HALAL',
  'KOSHER',
  'GLUTEN_FREE',
  'DAIRY_FREE',
  'NUT_FREE',
  'SPICY',
  'CONTAINS_ALCOHOL',
] as const

export type DietaryLabel = (typeof dietaryLabels)[number]

export const isDietaryLabel = (value: unknown): value is DietaryLabel =>
  typeof value === 'string' && (dietaryLabels as readonly string[]).includes(value)
