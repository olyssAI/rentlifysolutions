import assert from 'node:assert/strict'

import { getIPFromHeader } from '@better-auth/core/utils/ip'

/**
 * Authentication rate limits are keyed on the resolved client IP, so how that address is
 * derived from `x-forwarded-for` decides whether the limit can be evaded. These assertions
 * pin the resolution rules the deployment depends on.
 *
 * They deliberately require no database, no server and no environment configuration.
 */
const trustedProxies = ['10.0.0.0/8']

// A proxy chain is walked from the right, so an address prepended by the client is discarded.
assert.equal(getIPFromHeader('203.0.113.9, 10.0.0.7', { trustedProxies }), '203.0.113.9')
assert.equal(getIPFromHeader('9.9.9.9, 203.0.113.9, 10.0.0.7', { trustedProxies }), '203.0.113.9')

// An entirely trusted chain yields no client address rather than trusting a proxy hop.
assert.equal(getIPFromHeader('10.0.0.8, 10.0.0.7', { trustedProxies }), null)

// Without a trusted proxy list a multi-hop header is refused outright, which collapses every
// caller into one shared bucket instead of silently trusting a spoofable value.
assert.equal(getIPFromHeader('1.2.3.4, 10.0.0.7', { trustedProxies: [] }), null)

/**
 * KNOWN LIMITATION, asserted so it cannot regress unnoticed.
 *
 * A single-value header is accepted as the client address whether or not a trusted proxy list
 * is configured, because the library never sees the TCP peer address. Configuration therefore
 * cannot stop a caller that reaches the API directly from choosing its own rate-limit bucket.
 *
 * The deployment must make the API reachable only through the proxy. Until that is enforced
 * and verified at the network layer, per-IP rate limiting is not proven.
 */
assert.equal(getIPFromHeader('1.2.3.4', { trustedProxies: [] }), '1.2.3.4')
assert.equal(getIPFromHeader('1.2.3.4', { trustedProxies }), '1.2.3.4')

console.info('Client IP resolution test passed, including the documented direct-connection limitation.')
