import type { SetupMethod, SetupStep } from './developer-setup'
import { describe, expect, it } from 'vitest'
import { buildSetupSteps } from './developer-setup'

const RAW_KEY = 'gsd_user_0123456789abcdef0123456789abcdef'
const METHODS: SetupMethod[] = ['cli', 'mcp', 'api']

function commands(steps: SetupStep[]) {
  return steps.flatMap(step => step._tag === 'command' ? [step.command] : [])
}

describe('buildSetupSteps', () => {
  it.each(METHODS)('%s: shows a masked key and copies the full key', (method) => {
    const withKey = commands(buildSetupSteps(method, RAW_KEY, 's_01'))
    const displayed = withKey.map(command => command.display).join('\n')
    const copied = withKey.map(command => command.copy).join('\n')
    expect(displayed).not.toContain(RAW_KEY)
    expect(displayed).toContain('gsd_user_••••cdef')
    expect(copied).toContain(RAW_KEY)
  })

  it('uses the placeholder in the copied CLI sign-in before a key exists', () => {
    const signIn = commands(buildSetupSteps('cli', null, null)).find(command => command.copy.includes('auth login'))
    expect(signIn?.copy).toBe('GSCDUMP_API_KEY=$GSCDUMP_API_KEY gscdump auth login --mode cloud')
  })

  it('writes a Cursor config that parses and reads the key from the environment before a key exists', () => {
    const config = commands(buildSetupSteps('mcp', null, null)).map(command => command.copy).find(copy => copy.startsWith('{'))
    expect(JSON.parse(config!)).toEqual({
      // eslint-disable-next-line no-template-curly-in-string
      mcpServers: { gscdump: { url: 'https://gscdump.com/mcp', headers: { 'x-api-key': '${env:GSCDUMP_API_KEY}' } } },
    })
  })

  it('queries the given Site, or a placeholder Site ID when none is connected', () => {
    const [withSite] = commands(buildSetupSteps('api', null, 's_abc'))
    const [withoutSite] = commands(buildSetupSteps('api', null, null))
    expect(withSite?.copy).toContain('https://gscdump.com/api/analytics/v1/sites/s_abc/reports')
    expect(withoutSite?.copy).toContain('https://gscdump.com/api/analytics/v1/sites/s_your_site/reports')
  })
})
