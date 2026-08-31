import { sql } from 'drizzle-orm'

import { database } from '../../database/client.js'

type Transaction = Parameters<Parameters<typeof database.transaction>[0]>[0]

/**
 * Serialises configuration changes for one restaurant.
 *
 * Entitlement rules are decided by reading current state and then writing. Without a lock two
 * concurrent requests can each read a state their own write invalidates: an owner enabling
 * delivery on a location while an administrator removes the delivery feature both pass, and
 * the restaurant ends up using a capability its package does not include.
 *
 * The lock is held for the transaction, so it is released on commit or rollback.
 */
export const withRestaurantConfigurationLock = <Result>(
  restaurantId: string,
  operation: (transaction: Transaction) => Promise<Result>,
): Promise<Result> =>
  database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`restaurant-configuration:${restaurantId}`}))`,
    )
    return operation(transaction)
  })
