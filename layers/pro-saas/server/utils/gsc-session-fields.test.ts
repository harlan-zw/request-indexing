import { GSC_INDEXING_SCOPE, GSC_READ_SCOPE, GSC_WRITE_SCOPE } from 'gscdump'
import { describe, expect, it } from 'vitest'
import { buildGscSessionFields } from './gsc-session-fields'

describe('buildGscSessionFields', () => {
  it('reports every field as disconnected without a google account', () => {
    expect(buildGscSessionFields(null)).toEqual({
      gscConnected: false,
      gscEmail: null,
      googleScopes: null,
      gscIndexingScope: false,
      gscSitemapsScope: false,
    })
  })

  it('withholds both write scopes from a read-only grant', () => {
    const fields = buildGscSessionFields({
      payload: { email: 'reader@example.com' },
      tokens: { scope: `email ${GSC_READ_SCOPE}` },
    })
    expect(fields.gscConnected).toBe(true)
    expect(fields.gscEmail).toBe('reader@example.com')
    expect(fields.gscIndexingScope).toBe(false)
    expect(fields.gscSitemapsScope).toBe(false)
  })

  it('reports the sitemap scope for a webmasters grant', () => {
    const fields = buildGscSessionFields({ tokens: { scope: `email ${GSC_WRITE_SCOPE}` } })
    expect(fields.gscSitemapsScope).toBe(true)
    expect(fields.gscIndexingScope).toBe(false)
  })

  it('reports the indexing scope for an indexing grant', () => {
    const fields = buildGscSessionFields({ tokens: { scope: `email ${GSC_INDEXING_SCOPE}` } })
    expect(fields.gscIndexingScope).toBe(true)
    expect(fields.gscSitemapsScope).toBe(false)
  })

  it('reports both scopes for the full grant', () => {
    const fields = buildGscSessionFields({
      tokens: { scope: `email ${GSC_WRITE_SCOPE} ${GSC_INDEXING_SCOPE}` },
    })
    expect(fields.gscIndexingScope).toBe(true)
    expect(fields.gscSitemapsScope).toBe(true)
  })

  it('keeps a connected account with no scope string from claiming scopes', () => {
    const fields = buildGscSessionFields({ tokens: {} })
    expect(fields.gscConnected).toBe(true)
    expect(fields.googleScopes).toBeNull()
    expect(fields.gscIndexingScope).toBe(false)
    expect(fields.gscSitemapsScope).toBe(false)
  })
})
