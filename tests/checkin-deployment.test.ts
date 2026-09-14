import { expect, it } from 'vitest'
import { resolveCheckinDeployment } from '../server/utils/checkin-deployment'

it('uses the Worker version when Cloudflare provides an empty tag', () => {
  expect(resolveCheckinDeployment({ tag: '', id: 'worker-version' })).toBe('worker-version')
})

it('uses a nonempty release tag before the Worker version', () => {
  expect(resolveCheckinDeployment({ tag: 'release-sha', id: 'worker-version' })).toBe('release-sha')
})

it('keeps missing identity explicit', () => {
  expect(resolveCheckinDeployment({ tag: '', id: '' })).toBe('unknown')
  expect(resolveCheckinDeployment(undefined)).toBe('unknown')
})
