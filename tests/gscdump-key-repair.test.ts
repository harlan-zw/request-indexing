import { describe, expect, it } from 'vitest'
import { probeOutcomeFromError, shouldRepairGscdumpKey } from '../layers/pro-gsc/server/utils/gscdump-key-repair'

// The old recovery fired only when no key was held, so a key that was present
// but dead stayed dead: gscdump compares hashes, so our copy looks healthy right
// up until every read 401s. These pin the two halves of the replacement — repair
// on rejection, never on a wobble.

describe('shouldRepairGscdumpKey', () => {
  it('repairs when no key is held, whatever the probe says', () => {
    for (const probe of ['ok', 'unauthorized', 'error', 'skipped'] as const)
      expect(shouldRepairGscdumpKey({ storedKey: null, probe })).toBe(true)
  })

  it('repairs a held key only when gscdump explicitly rejected it', () => {
    expect(shouldRepairGscdumpKey({ storedKey: 'gsd_user_live', probe: 'unauthorized' })).toBe(true)
  })

  it('leaves a held key alone on success or on an inconclusive failure', () => {
    // A transient gscdump failure must not rotate a working credential, or every
    // upstream wobble turns into a key change the browser proxy then 401s on.
    for (const probe of ['ok', 'error', 'skipped'] as const)
      expect(shouldRepairGscdumpKey({ storedKey: 'gsd_user_live', probe })).toBe(false)
  })
})

describe('probeOutcomeFromError', () => {
  it.each([401, 403])('reads %i as an explicit rejection', (status) => {
    expect(probeOutcomeFromError({ status })).toBe('unauthorized')
    expect(probeOutcomeFromError({ statusCode: status })).toBe('unauthorized')
    expect(probeOutcomeFromError({ response: { status } })).toBe('unauthorized')
  })

  it.each([500, 502, 429])('reads %i as inconclusive', (status) => {
    expect(probeOutcomeFromError({ status })).toBe('error')
  })

  it('reads a network failure with no status as inconclusive', () => {
    expect(probeOutcomeFromError(new Error('fetch failed'))).toBe('error')
    expect(probeOutcomeFromError(undefined)).toBe('error')
  })
})
