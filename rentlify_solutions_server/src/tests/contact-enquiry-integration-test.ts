import '../config/load-environment.js'

import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import { eq } from 'drizzle-orm'

import { createApplication } from '../app.js'
import { environment } from '../config/environment.js'
import { database, databasePool } from '../database/client.js'
import { apiRequestThrottle, contactEnquiry } from '../database/schema/platform-schema.js'

const application = createApplication()
const server = application.listen(0, '127.0.0.1')
const testEmail = `contact-test-${Date.now()}@example.com`

try {
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })

  const address = server.address() as AddressInfo
  const serverUrl = `http://127.0.0.1:${address.port}`
  const marketingTestOrigin = environment.MARKETING_SITE_ORIGINS.at(-1) ?? environment.PRIMARY_MARKETING_SITE_ORIGIN

  const preflightResponse = await fetch(`${serverUrl}/api/public/contact`, {
    method: 'OPTIONS',
    headers: {
      Origin: marketingTestOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })
  assert.equal(preflightResponse.status, 204)
  assert.equal(preflightResponse.headers.get('access-control-allow-origin'), marketingTestOrigin)

  const untrustedOriginResponse = await fetch(`${serverUrl}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' },
    body: JSON.stringify({}),
  })
  assert.equal(untrustedOriginResponse.status, 403)

  const invalidPayloadResponse = await fetch(`${serverUrl}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: marketingTestOrigin },
    body: JSON.stringify({ unexpectedAuthorization: 'SUPER_ADMIN' }),
  })
  assert.equal(invalidPayloadResponse.status, 400)
  const invalidPayloadBody = (await invalidPayloadResponse.json()) as {
    success: boolean
    error?: { code?: string }
  }
  assert.equal(invalidPayloadBody.success, false)
  assert.equal(invalidPayloadBody.error?.code, 'VALIDATION_ERROR')

  const validPayloadResponse = await fetch(`${serverUrl}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: marketingTestOrigin },
    body: JSON.stringify({
      name: 'Contact Test Customer',
      email: testEmail,
      phone: '+92 300 1234567',
      businessName: 'Contact Test Business',
      industry: 'RESTAURANT',
      helpType: 'COMPLETE_SOLUTION',
      message: 'We need a complete digital ordering solution for our growing restaurant business.',
      website: '',
    }),
  })
  assert.equal(validPayloadResponse.status, 202)
  assert.deepEqual(await validPayloadResponse.json(), { success: true, data: { accepted: true } })

  const [persistedEnquiry] = await database
    .select({
      email: contactEnquiry.email,
      industry: contactEnquiry.industry,
      helpType: contactEnquiry.helpType,
      status: contactEnquiry.status,
    })
    .from(contactEnquiry)
    .where(eq(contactEnquiry.email, testEmail))
    .limit(1)
  assert.deepEqual(persistedEnquiry, {
    email: testEmail,
    industry: 'RESTAURANT',
    helpType: 'COMPLETE_SOLUTION',
    status: 'NEW',
  })

  console.log(
    'Contact enquiry integration test passed: CORS, trusted origin, throttling boundary, strict validation, and successful persistence.',
  )
} finally {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
  await database.delete(contactEnquiry).where(eq(contactEnquiry.email, testEmail))
  await database.delete(apiRequestThrottle).where(eq(apiRequestThrottle.throttleKey, 'contact-enquiry:127.0.0.1'))
  await databasePool.end()
}
