import { describe, expect, it } from 'vitest'
import { readConfigSecrets, REQUIRED_CONFIG_SECRETS, resolveRequiredConfig } from '../shared/server/required-config'

function presentValues(): Record<string, string> {
  return Object.fromEntries(REQUIRED_CONFIG_SECRETS.map(({ env }) => [env, `test-${env}`]))
}

describe('resolveRequiredConfig', () => {
  it('reports every required secret as missing when none resolve', () => {
    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, {})).toEqual({
      _tag: 'missing',
      secrets: REQUIRED_CONFIG_SECRETS.map(({ env, path }) => ({ env, path })),
    })
  })

  it('reports each missing secret by name, not just the first', () => {
    const values = presentValues()
    delete values.NUXT_SESSION_PASSWORD
    delete values.NUXT_POSTMARK_API_KEY

    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, values)).toEqual({
      _tag: 'missing',
      secrets: [
        { env: 'NUXT_POSTMARK_API_KEY', path: 'postmark.apiKey' },
        { env: 'NUXT_SESSION_PASSWORD', path: 'session.password' },
      ],
    })
  })

  it('treats an empty session password as missing', () => {
    const values = presentValues()
    values.NUXT_SESSION_PASSWORD = ''

    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, values)).toEqual({
      _tag: 'missing',
      secrets: [{ env: 'NUXT_SESSION_PASSWORD', path: 'session.password' }],
    })
  })

  it('treats a null value as missing', () => {
    const values = presentValues()
    values.NUXT_KEY = null as unknown as string

    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, values)).toEqual({
      _tag: 'missing',
      secrets: [{ env: 'NUXT_KEY', path: 'key' }],
    })
  })

  it('passes when every required secret resolves', () => {
    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, presentValues())).toEqual({ _tag: 'ok' })
  })
})

describe('readConfigSecrets', () => {
  it('reads nested runtime config paths into values keyed by env name', () => {
    const config = {
      key: 'app-key',
      session: { password: 'session-pass' },
    }

    const values = readConfigSecrets(REQUIRED_CONFIG_SECRETS, config)

    expect(values.NUXT_KEY).toBe('app-key')
    expect(values.NUXT_SESSION_PASSWORD).toBe('session-pass')
    expect(values.NUXT_POSTMARK_API_KEY).toBeUndefined()
  })

  it('composes with resolveRequiredConfig on a default-shaped config', () => {
    const config = {
      dataforseo: { login: 'login', password: 'secret' },
      gscdump: { apiKey: 'gsc-key', webhookSecret: 'wh-sec' },
      key: 'app-key',
      oauth: { google: { clientSecret: 'oauth-secret' } },
      postmark: { apiKey: 'pm-key' },
      session: { password: '' },
    }

    const values = readConfigSecrets(REQUIRED_CONFIG_SECRETS, config)

    expect(resolveRequiredConfig(REQUIRED_CONFIG_SECRETS, values)).toEqual({
      _tag: 'missing',
      secrets: [{ env: 'NUXT_SESSION_PASSWORD', path: 'session.password' }],
    })
  })
})
