/**
 * Application roles.
 *
 * `PLATFORM_USER` is the default for any newly created account. Privileged roles are
 * never assigned by account creation; they are granted explicitly by a reviewed
 * server-side workflow such as the super administrator seed.
 */
export { roles, type Role } from '@rentlify/authorization-contracts'

import { roles, type Role } from '@rentlify/authorization-contracts'

export const defaultRole: Role = roles.platformUser

export const isSuperAdministrator = (role: unknown): boolean => role === roles.superAdministrator

export const isRestaurantOwner = (role: unknown): boolean => role === roles.restaurantOwner

export const isCustomer = (role: unknown): boolean => role === roles.customer
