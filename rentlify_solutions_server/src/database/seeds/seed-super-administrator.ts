import '../../config/load-environment.js'

import { eq } from 'drizzle-orm'

import { database, databasePool } from '../client.js'
import { environment } from '../../config/environment.js'
import { user } from '../schema/auth-schema.js'
import { createAuthentication } from '../../modules/authentication/authentication.js'
import { roles } from '../../modules/authentication/roles.js'

const requiredSeedValue = (name: string, value: string | undefined) => {
  if (!value) {
    throw new Error(`${name} is required to seed the super administrator.`)
  }

  return value
}

const seedSuperAdministrator = async () => {
  const name = requiredSeedValue('SUPER_ADMIN_NAME', environment.SUPER_ADMIN_NAME)
  const email = requiredSeedValue('SUPER_ADMIN_EMAIL', environment.SUPER_ADMIN_EMAIL).trim().toLowerCase()
  const password = requiredSeedValue('SUPER_ADMIN_PASSWORD', environment.SUPER_ADMIN_PASSWORD)
  const seedAuthentication = createAuthentication({ allowAccountCreation: true })

  try {
    const [existing] = await database.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)

    if (existing) {
      // Deliberately narrow: only the role is reconciled. Re-running the seed must never
      // silently reset a live account's password or name from environment values, and
      // changing SUPER_ADMIN_PASSWORD here will NOT change the existing password.
      console.info(`Super administrator already exists for ${email}.`)
      console.info('Only the role is reconciled. The existing name and password are left unchanged.')
      console.info('To rotate the password, use an account-management workflow rather than this seed.')
    } else {
      await seedAuthentication.api.signUpEmail({ body: { name, email, password } })
      console.info(`Super administrator account created for ${email}.`)
    }

    // Accounts are created with the default non-privileged role. The privileged role is
    // granted here, deliberately, rather than being the default for every new account.
    const granted = await database
      .update(user)
      .set({ role: roles.superAdministrator })
      .where(eq(user.email, email))
      .returning({ id: user.id })

    if (granted.length === 0) {
      throw new Error(`No account was found for ${email} after seeding.`)
    }

    console.info(`Granted ${roles.superAdministrator} to ${email}.`)
  } catch (error) {
    console.error('Super administrator seed failed. Check the database connection and the seed credentials.')
    throw error
  } finally {
    await databasePool.end()
  }
}

await seedSuperAdministrator()
