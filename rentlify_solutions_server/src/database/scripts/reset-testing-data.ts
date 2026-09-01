import '../../config/load-environment.js'

import assert from 'node:assert/strict'

import { count, eq, ne, sql } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'

import { database, databasePool } from '../client.js'
import { account, rateLimit, session, user, verification } from '../schema/auth-schema.js'
import {
  apiRequestThrottle,
  contactEnquiry,
  customerOrder,
  packageFeature,
  restaurant,
  subscriptionPackage,
} from '../schema/platform-schema.js'

const resetAuthorizationSchema = z.object({
  RESET_CONFIRMATION: z.literal('DELETE_ALL_TEST_DATA_EXCEPT_SUPER_ADMIN'),
  RESET_PRESERVED_SUPER_ADMIN_EMAIL: z
    .string()
    .trim()
    .max(254)
    .email()
    .transform((email) => email.toLowerCase()),
})

const authorization = resetAuthorizationSchema.parse(process.env)

type DatabaseTransaction = Parameters<Parameters<typeof database.transaction>[0]>[0]

const readCount = async (transaction: DatabaseTransaction, table: PgTable) => {
  const [result] = await transaction.select({ value: count() }).from(table)
  return result?.value ?? 0
}

const run = async () => {
  try {
    const summary = await database.transaction(async (transaction) => {
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext('rentlify_testing_data_reset'))`)

      const administrators = await transaction
        .select({ id: user.id, email: user.email })
        .from(user)
        .where(eq(user.role, 'SUPER_ADMIN'))

      assert.equal(
        administrators.length,
        1,
        `Reset requires exactly one SUPER_ADMIN, but found ${administrators.length}. No data was deleted.`,
      )

      const [preservedAdministrator] = administrators
      assert(preservedAdministrator, 'The preserved SUPER_ADMIN could not be resolved.')
      assert.equal(
        preservedAdministrator.email.trim().toLowerCase(),
        authorization.RESET_PRESERVED_SUPER_ADMIN_EMAIL,
        'RESET_PRESERVED_SUPER_ADMIN_EMAIL does not match the only SUPER_ADMIN. No data was deleted.',
      )

      const before = {
        restaurants: await readCount(transaction, restaurant),
        orders: await readCount(transaction, customerOrder),
        users: await readCount(transaction, user),
        contactEnquiries: await readCount(transaction, contactEnquiry),
      }

      // Every tenant-owned table has a foreign-key path from restaurant. PostgreSQL resolves the
      // complete dependency graph here, including order tables whose deletion policy deliberately
      // blocks ordinary restaurant deletion. Platform packages and users are parent roots and are
      // therefore outside this cascade.
      await transaction.execute(sql.raw('truncate table "restaurant" cascade'))
      await transaction.delete(contactEnquiry)
      await transaction.delete(apiRequestThrottle)
      await transaction.delete(rateLimit)
      await transaction.delete(verification)
      await transaction.delete(session)
      await transaction.delete(user).where(ne(user.id, preservedAdministrator.id))

      const [remainingAdministrator] = await transaction
        .select({ id: user.id, email: user.email, role: user.role })
        .from(user)
        .where(eq(user.id, preservedAdministrator.id))
        .limit(1)
      assert(remainingAdministrator, 'The preserved SUPER_ADMIN was unexpectedly deleted.')
      assert.equal(remainingAdministrator.role, 'SUPER_ADMIN')

      const remaining = {
        restaurants: await readCount(transaction, restaurant),
        orders: await readCount(transaction, customerOrder),
        users: await readCount(transaction, user),
        sessions: await readCount(transaction, session),
        contactEnquiries: await readCount(transaction, contactEnquiry),
        rateLimits: await readCount(transaction, rateLimit),
        requestThrottles: await readCount(transaction, apiRequestThrottle),
        subscriptionPackages: await readCount(transaction, subscriptionPackage),
        packageFeatures: await readCount(transaction, packageFeature),
        administratorCredentialAccounts: Number(
          (
            await transaction
              .select({ value: count() })
              .from(account)
              .where(eq(account.userId, preservedAdministrator.id))
          )[0]?.value ?? 0,
        ),
      }

      assert.deepEqual(
        {
          restaurants: remaining.restaurants,
          orders: remaining.orders,
          users: remaining.users,
          sessions: remaining.sessions,
          contactEnquiries: remaining.contactEnquiries,
          rateLimits: remaining.rateLimits,
          requestThrottles: remaining.requestThrottles,
        },
        {
          restaurants: 0,
          orders: 0,
          users: 1,
          sessions: 0,
          contactEnquiries: 0,
          rateLimits: 0,
          requestThrottles: 0,
        },
        'Post-reset verification failed. The transaction will be rolled back.',
      )
      assert(remaining.subscriptionPackages > 0, 'The platform package catalogue is missing.')
      assert(remaining.packageFeatures > 0, 'The platform feature catalogue is missing.')
      assert(
        remaining.administratorCredentialAccounts > 0,
        'The preserved SUPER_ADMIN has no credential account and would be unable to sign in.',
      )

      return { before, remaining, preservedAdministratorEmail: remainingAdministrator.email }
    })

    console.info('Testing data reset completed successfully.')
    console.info(JSON.stringify(summary, null, 2))
    console.info('All sessions were removed. Sign in again with the preserved SUPER_ADMIN account.')
  } finally {
    await databasePool.end()
  }
}

run().catch((error: unknown) => {
  console.error('Testing data reset failed. The transaction was rolled back.', error)
  process.exitCode = 1
})
