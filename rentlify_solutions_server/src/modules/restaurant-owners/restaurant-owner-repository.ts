import { randomUUID } from 'node:crypto'

import { and, asc, eq, sql } from 'drizzle-orm'

import { database } from '../../database/client.js'
import { session, user } from '../../database/schema/auth-schema.js'
import { restaurant, restaurantMembership, restaurantOwnerProvisioning } from '../../database/schema/platform-schema.js'

export const restaurantOwnerRepository = {
  findUserByEmail: async (email: string) => {
    const [record] = await database
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(sql`lower(${user.email}) = ${email.toLowerCase()}`)
      .limit(1)
    return record ?? null
  },

  findMembershipForUser: async (userId: string) => {
    const [record] = await database
      .select({ id: restaurantMembership.id, restaurantId: restaurantMembership.restaurantId })
      .from(restaurantMembership)
      .where(eq(restaurantMembership.userId, userId))
      .limit(1)
    return record ?? null
  },

  findPrimaryOwnerProvisioning: async (restaurantId: string) => {
    const [record] = await database
      .select()
      .from(restaurantOwnerProvisioning)
      .where(eq(restaurantOwnerProvisioning.restaurantId, restaurantId))
      .limit(1)
    return record ?? null
  },

  findOwnerProvisioningByEmail: async (normalizedEmail: string) => {
    const [record] = await database
      .select()
      .from(restaurantOwnerProvisioning)
      .where(eq(restaurantOwnerProvisioning.normalizedEmail, normalizedEmail))
      .limit(1)
    return record ?? null
  },

  beginPrimaryOwnerProvisioning: (restaurantId: string, normalizedEmail: string) =>
    database.transaction(async (transaction) => {
      await transaction
        .insert(restaurantOwnerProvisioning)
        .values({ id: randomUUID(), restaurantId, normalizedEmail })
        .onConflictDoNothing()
      const [record] = await transaction
        .select()
        .from(restaurantOwnerProvisioning)
        .where(eq(restaurantOwnerProvisioning.restaurantId, restaurantId))
        .limit(1)
      if (!record) throw new Error('The owner provisioning record was not created.')
      return record
    }),

  findRestaurantById: async (restaurantId: string) => {
    const [record] = await database
      .select({ id: restaurant.id, name: restaurant.name })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1)
    return record ?? null
  },

  findPrimaryOwnerForRestaurant: async (restaurantId: string) => {
    const [record] = await database
      .select({ id: restaurantMembership.id })
      .from(restaurantMembership)
      .where(and(eq(restaurantMembership.restaurantId, restaurantId), eq(restaurantMembership.isPrimary, true)))
      .limit(1)
    return record ?? null
  },

  grantPrimaryOwnership: (restaurantId: string, userId: string, role: string) =>
    database.transaction(async (transaction) => {
      await transaction.update(user).set({ role, passwordChangeRecommended: true }).where(eq(user.id, userId))
      const [membership] = await transaction
        .insert(restaurantMembership)
        .values({ id: randomUUID(), restaurantId, userId, membershipRole: 'OWNER', isPrimary: true })
        .returning()
      if (!membership) throw new Error('The ownership membership was not created.')
      await transaction
        .update(restaurantOwnerProvisioning)
        .set({ state: 'COMPLETED', createdUserId: userId })
        .where(eq(restaurantOwnerProvisioning.restaurantId, restaurantId))
      return membership
    }),

  findMembershipInRestaurant: async (restaurantId: string, membershipId: string) => {
    const [record] = await database
      .select({
        id: restaurantMembership.id,
        userId: restaurantMembership.userId,
        isPrimary: restaurantMembership.isPrimary,
        email: user.email,
        name: user.name,
      })
      .from(restaurantMembership)
      .innerJoin(user, eq(user.id, restaurantMembership.userId))
      .where(and(eq(restaurantMembership.restaurantId, restaurantId), eq(restaurantMembership.id, membershipId)))
      .limit(1)
    return record ?? null
  },

  /**
   * Removes one restaurant membership and, when the account keeps no other membership,
   * returns it to the unprivileged default role and destroys its sessions. Revocation that
   * left a live session behind would not be revocation.
   */
  revokeMembership: (membershipId: string, userId: string, unprivilegedRole: string) =>
    database.transaction(async (transaction) => {
      await transaction.delete(restaurantMembership).where(eq(restaurantMembership.id, membershipId))

      const remaining = await transaction
        .select({ id: restaurantMembership.id })
        .from(restaurantMembership)
        .where(eq(restaurantMembership.userId, userId))
        .limit(1)

      if (remaining.length === 0) {
        await transaction.update(user).set({ role: unprivilegedRole }).where(eq(user.id, userId))
      }

      await transaction.delete(session).where(eq(session.userId, userId))

      // The pending provisioning intent is cleared so the same email can be invited again.
      await transaction.delete(restaurantOwnerProvisioning).where(eq(restaurantOwnerProvisioning.createdUserId, userId))

      return { downgradedRole: remaining.length === 0 }
    }),

  listOwners: (restaurantId: string) =>
    database
      .select({
        membershipId: restaurantMembership.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        membershipRole: restaurantMembership.membershipRole,
        isPrimary: restaurantMembership.isPrimary,
        createdAt: restaurantMembership.createdAt,
      })
      .from(restaurantMembership)
      .innerJoin(user, eq(user.id, restaurantMembership.userId))
      .where(eq(restaurantMembership.restaurantId, restaurantId))
      .orderBy(asc(user.name)),

  listMembershipsByUserId: (userId: string) =>
    database
      .select({
        membershipId: restaurantMembership.id,
        restaurantId: restaurantMembership.restaurantId,
        membershipRole: restaurantMembership.membershipRole,
        isPrimary: restaurantMembership.isPrimary,
        restaurantName: restaurant.name,
        restaurantStatus: restaurant.status,
      })
      .from(restaurantMembership)
      .innerJoin(restaurant, eq(restaurant.id, restaurantMembership.restaurantId))
      .where(eq(restaurantMembership.userId, userId))
      .orderBy(asc(restaurantMembership.createdAt), asc(restaurantMembership.id))
      .limit(2),
}
