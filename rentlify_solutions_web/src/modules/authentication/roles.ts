/**
 * Mirrors the server role constants. The server remains authoritative; these values only
 * decide what the interface offers to show.
 */
export { roles, type Role } from '@rentlify/authorization-contracts'

import { roles } from '@rentlify/authorization-contracts'

export const isSuperAdministrator = (role: unknown): boolean => role === roles.superAdministrator

export const isRestaurantOwner = (role: unknown): boolean => role === roles.restaurantOwner

export const dashboardPathForRole = (role: unknown): string | null => {
  if (isSuperAdministrator(role)) return '/dashboard'
  if (isRestaurantOwner(role)) return '/dashboard'
  return null
}
