import '../config/load-environment.js'

import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'

import { eq } from 'drizzle-orm'

import { createApplication } from '../app.js'
import { environment } from '../config/environment.js'
import { database, databasePool } from '../database/client.js'
import { rateLimit, user } from '../database/schema/auth-schema.js'
import { createAuthentication } from '../modules/authentication/authentication.js'
import { roles } from '../modules/authentication/roles.js'

const requiredCredential = (name: string, value: string | undefined) => {
  assert(value, `${name} is required for the authentication integration test.`)
  return value
}

const application = createApplication()
const server = application.listen(0, '127.0.0.1')
const localSignUpRateLimitKey = '127.0.0.1|/sign-up/email'

try {
  await database.delete(rateLimit).where(eq(rateLimit.key, localSignUpRateLimitKey))
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address() as AddressInfo
  const serverUrl = `http://127.0.0.1:${address.port}`
  const email = requiredCredential('SUPER_ADMIN_EMAIL', environment.SUPER_ADMIN_EMAIL)
  const password = requiredCredential('SUPER_ADMIN_PASSWORD', environment.SUPER_ADMIN_PASSWORD)
  const authenticationTestOrigin = environment.FRONTEND_ORIGINS.at(-1) ?? environment.PRIMARY_FRONTEND_ORIGIN
  const jsonHeaders = { 'Content-Type': 'application/json', Origin: authenticationTestOrigin }

  if (environment.NODE_ENV === 'production') {
    assert(
      environment.TRUSTED_PROXY_IPS.length > 0,
      'Production must declare TRUSTED_PROXY_IPS so authentication rate limits resolve a client address.',
    )
  }

  const unauthenticatedResponse = await fetch(`${serverUrl}/api/authenticated/session`)
  assert.equal(unauthenticatedResponse.status, 401)

  // Public account creation must stay closed; privileged accounts come from the reviewed seed.
  const signUpResponse = await fetch(`${serverUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      name: 'Uninvited',
      email: `uninvited-${Date.now()}@example.test`,
      password: 'a-long-enough-password',
    }),
  })
  assert.notEqual(signUpResponse.status, 200, 'Public sign-up must not succeed.')

  // Customer registration is isolated to its own auth surface and can create only CUSTOMER accounts.
  const customerEmail = `customer-${Date.now()}@example.test`
  const customerPassword = 'CustomerAccount#2026!'
  const customerSignUpResponse = await fetch(`${serverUrl}/api/customer-auth/sign-up/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ name: 'Test Customer', email: customerEmail, password: customerPassword }),
  })
  assert.equal(customerSignUpResponse.status, 200)

  try {
    const [customer] = await database
      .select({ role: user.role })
      .from(user)
      .where(eq(user.email, customerEmail))
      .limit(1)
    assert.equal(customer?.role, roles.customer)

    const customerLoginResponse = await fetch(`${serverUrl}/api/customer-auth/sign-in/email`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: customerEmail, password: customerPassword }),
    })
    assert.equal(customerLoginResponse.status, 200)
    assert(
      customerLoginResponse.headers.getSetCookie().some((cookie) => cookie.startsWith('rentlify-customer.')),
      'Customer sessions must use the isolated customer cookie prefix.',
    )
  } finally {
    await database.delete(user).where(eq(user.email, customerEmail))
  }

  const unknownRouteResponse = await fetch(`${serverUrl}/does-not-exist`)
  assert.equal(unknownRouteResponse.status, 404)
  const unknownRouteBody = (await unknownRouteResponse.json()) as { error?: { code?: string } }
  assert.equal(unknownRouteBody.error?.code, 'NOT_FOUND')

  const invalidLoginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password: `${password}-invalid` }),
  })
  assert.equal(invalidLoginResponse.status, 401)

  const loginResponse = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ email, password, rememberMe: false }),
  })
  assert.equal(loginResponse.status, 200)

  const setCookies = loginResponse.headers.getSetCookie()
  const sessionCookie = setCookies.map((cookie) => cookie.split(';', 1)[0]).join('; ')
  assert(sessionCookie, 'A session cookie was not issued.')
  assert(
    setCookies.some((cookie) => /;\s*HttpOnly/i.test(cookie)),
    'The session cookie must be HTTP-only.',
  )
  assert(
    setCookies.some((cookie) => /;\s*SameSite=Lax/i.test(cookie)),
    'The development cookie must use SameSite=Lax.',
  )

  const sessionResponse = await fetch(`${serverUrl}/api/auth/get-session`, {
    headers: { Cookie: sessionCookie, Origin: environment.PRIMARY_FRONTEND_ORIGIN },
  })
  assert.equal(sessionResponse.status, 200)
  const session = (await sessionResponse.json()) as { user?: { role?: string } } | null
  assert.equal(session?.user?.role, 'SUPER_ADMIN')

  const protectedResponse = await fetch(`${serverUrl}/api/authenticated/session`, {
    headers: { Cookie: sessionCookie, Origin: environment.PRIMARY_FRONTEND_ORIGIN },
  })
  assert.equal(protectedResponse.status, 200)

  // An authenticated account without the privileged role must be refused, and must be told
  // it is forbidden rather than unauthenticated.
  const nonPrivilegedEmail = `platform-user-${Date.now()}@example.test`
  const nonPrivilegedPassword = 'PlatformUser#2026!'
  const seedAuthentication = createAuthentication({ allowAccountCreation: true })
  await seedAuthentication.api.signUpEmail({
    body: { name: 'Platform User', email: nonPrivilegedEmail, password: nonPrivilegedPassword },
  })

  try {
    const [createdUser] = await database
      .select({ role: user.role })
      .from(user)
      .where(eq(user.email, nonPrivilegedEmail))
      .limit(1)
    assert.equal(createdUser?.role, roles.platformUser, 'A new account must not be created with a privileged role.')

    const nonPrivilegedLogin = await fetch(`${serverUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ email: nonPrivilegedEmail, password: nonPrivilegedPassword }),
    })
    assert.equal(nonPrivilegedLogin.status, 200)

    const nonPrivilegedCookie = nonPrivilegedLogin.headers
      .getSetCookie()
      .map((cookie) => cookie.split(';', 1)[0])
      .join('; ')

    const forbiddenResponse = await fetch(`${serverUrl}/api/authenticated/session`, {
      headers: { Cookie: nonPrivilegedCookie, Origin: environment.PRIMARY_FRONTEND_ORIGIN },
    })
    assert.equal(forbiddenResponse.status, 403)
    const forbiddenBody = (await forbiddenResponse.json()) as { error?: { code?: string } }
    assert.equal(forbiddenBody.error?.code, 'FORBIDDEN')
  } finally {
    await database.delete(user).where(eq(user.email, nonPrivilegedEmail))
  }

  const logoutResponse = await fetch(`${serverUrl}/api/auth/sign-out`, {
    method: 'POST',
    headers: { Cookie: sessionCookie, Origin: environment.PRIMARY_FRONTEND_ORIGIN },
  })
  assert.equal(logoutResponse.status, 200)

  const expiredSessionResponse = await fetch(`${serverUrl}/api/auth/get-session`, {
    headers: { Cookie: sessionCookie, Origin: environment.PRIMARY_FRONTEND_ORIGIN },
  })
  assert.equal(expiredSessionResponse.status, 200)
  assert.equal(await expiredSessionResponse.json(), null)

  console.info(
    'Authentication integration test passed: closed staff sign-up, isolated customer registration, login, cookie flags, roles, protected access, and logout.',
  )
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
  await database.delete(rateLimit).where(eq(rateLimit.key, localSignUpRateLimitKey))
  await databasePool.end()
}
