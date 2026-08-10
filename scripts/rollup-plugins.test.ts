import { describe, expect, it } from 'vitest'
import { withoutRollupPlugin } from './rollup-plugins'

describe('withoutRollupPlugin', () => {
  it('removes a nested named plugin without disturbing other plugins', () => {
    const plugins = [
      { name: 'unwasm' },
      [{ name: 'sentry-rollup-plugin' }],
      false,
    ]

    expect(withoutRollupPlugin(plugins, 'sentry-rollup-plugin')).toEqual([
      { name: 'unwasm' },
      false,
    ])
  })
})
