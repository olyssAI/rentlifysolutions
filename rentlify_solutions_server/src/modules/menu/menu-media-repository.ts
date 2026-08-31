import { and, asc, count, eq, gte, isNull, lt, or, sql } from 'drizzle-orm'

import { database } from '../../database/client.js'
import { menuCategory, menuItem, menuMediaUploadIntent } from '../../database/schema/platform-schema.js'

export const menuMediaRepository = {
  issueUploadIntent: async (
    input: { publicId: string; restaurantId: string; requestedByUserId: string; expiresAt: Date },
    since: Date,
    maximumAllowed: number,
  ) =>
    database.transaction(async (transaction) => {
      await transaction.execute(
        sql`select pg_advisory_xact_lock(hashtext(${`menu-media:${input.restaurantId}:${input.requestedByUserId}`}))`,
      )
      const [result] = await transaction
        .select({ value: count() })
        .from(menuMediaUploadIntent)
        .where(
          and(
            eq(menuMediaUploadIntent.restaurantId, input.restaurantId),
            eq(menuMediaUploadIntent.requestedByUserId, input.requestedByUserId),
            gte(menuMediaUploadIntent.createdAt, since),
          ),
        )
      if ((result?.value ?? 0) >= maximumAllowed) return false
      await transaction.insert(menuMediaUploadIntent).values(input)
      return true
    }),
  markAttached: (restaurantId: string, publicId: string) =>
    database
      .update(menuMediaUploadIntent)
      .set({ attachedAt: new Date() })
      .where(
        and(
          eq(menuMediaUploadIntent.publicId, publicId),
          eq(menuMediaUploadIntent.restaurantId, restaurantId),
          isNull(menuMediaUploadIntent.cleanedAt),
        ),
      ),
  listExpiredUnattached: (before: Date, retryBefore: Date, limit: number) =>
    database
      .select()
      .from(menuMediaUploadIntent)
      .where(
        and(
          lt(menuMediaUploadIntent.expiresAt, before),
          isNull(menuMediaUploadIntent.attachedAt),
          isNull(menuMediaUploadIntent.cleanedAt),
          or(
            isNull(menuMediaUploadIntent.cleanupAttemptedAt),
            lt(menuMediaUploadIntent.cleanupAttemptedAt, retryBefore),
          ),
        ),
      )
      // Never-attempted assets are handled before retries. Within each group, oldest
      // expirations run first for deterministic bounded batches.
      .orderBy(sql`${menuMediaUploadIntent.cleanupAttemptedAt} is not null`, asc(menuMediaUploadIntent.expiresAt))
      .limit(limit),
  isReferenced: async (restaurantId: string, publicId: string) => {
    const [categoryReference, itemReference] = await Promise.all([
      database
        .select({ id: menuCategory.id })
        .from(menuCategory)
        .where(and(eq(menuCategory.restaurantId, restaurantId), eq(menuCategory.imagePublicId, publicId)))
        .limit(1),
      database
        .select({ id: menuItem.id })
        .from(menuItem)
        .where(and(eq(menuItem.restaurantId, restaurantId), eq(menuItem.imagePublicId, publicId)))
        .limit(1),
    ])
    return Boolean(categoryReference[0] || itemReference[0])
  },
  markCleanupAttempted: (publicId: string) =>
    database
      .update(menuMediaUploadIntent)
      .set({ cleanupAttemptedAt: new Date() })
      .where(and(eq(menuMediaUploadIntent.publicId, publicId), isNull(menuMediaUploadIntent.cleanedAt))),
  markCleaned: (publicId: string) =>
    database
      .update(menuMediaUploadIntent)
      .set({ cleanedAt: new Date() })
      .where(
        and(
          eq(menuMediaUploadIntent.publicId, publicId),
          isNull(menuMediaUploadIntent.attachedAt),
          isNull(menuMediaUploadIntent.cleanedAt),
        ),
      ),
}
