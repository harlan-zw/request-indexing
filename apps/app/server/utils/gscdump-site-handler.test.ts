import type { H3Event } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineGscdumpSiteHandler } from './gscdump-site-handler'

// The Nitro auto-imports (`defineEventHandler`, `createError`, `requireTeamSite`)
// are free identifiers at runtime, so the unit test supplies them. The fake
// `requireTeamSite` is the real rule in miniature: a site resolves only when the
// caller's team is linked to it, exactly as the `team_sites` join enforces.

interface FakeSite {
  publicId: string
  teamId: number
  gscdumpSiteId: string | null
}

const SITES: FakeSite[] = [
  { publicId: 'acme-site', teamId: 1, gscdumpSiteId: 'gsc_acme' },
  { publicId: 'unregistered-site', teamId: 1, gscdumpSiteId: null },
]

function httpError(input: { statusCode: number, message: string }) {
  return Object.assign(new Error(input.message), { statusCode: input.statusCode })
}

/** A request as seen by the fake resolver: who is calling, and for which site. */
function makeEvent(callerTeamId: number, siteIdParam: string): H3Event {
  return { context: { callerTeamId, siteIdParam } } as unknown as H3Event
}

function statusCodeOf(error: unknown) {
  return (error as { statusCode?: number }).statusCode
}

beforeEach(() => {
  vi.stubGlobal('defineEventHandler', <T>(handler: T) => handler)
  vi.stubGlobal('createError', httpError)
  vi.stubGlobal('requireTeamSite', async (event: H3Event) => {
    const { callerTeamId, siteIdParam } = event.context as unknown as { callerTeamId: number, siteIdParam: string }
    const site = SITES.find(s => s.publicId === siteIdParam && s.teamId === callerTeamId)
    if (!site)
      throw httpError({ statusCode: 404, message: 'Site not found' })
    return { site, team: { team: { teamId: callerTeamId } } }
  })
})

afterEach(() => vi.unstubAllGlobals())

function callHandler(event: H3Event, handler: Parameters<typeof defineGscdumpSiteHandler>[0]) {
  const route = defineGscdumpSiteHandler(handler) as unknown as (event: H3Event) => Promise<unknown>
  return route(event)
}

describe('defineGscdumpSiteHandler', () => {
  it('runs the handler with the resolved gscdump site id for a team member', async () => {
    const seen: string[] = []

    const result = await callHandler(makeEvent(1, 'acme-site'), ({ gscdumpSiteId }) => {
      seen.push(gscdumpSiteId)
      return { ok: true }
    })

    expect(seen).toEqual(['gsc_acme'])
    expect(result).toEqual({ ok: true })
  })

  // Regression: every `/api/gscdump/[siteId]/*` route looked the site up by
  // public id alone, so any signed-in user could read another team's Search
  // Console data, or submit a sitemap to their property, by guessing the id.
  it('does not run the handler for a caller outside the site\'s team', async () => {
    const handler = vi.fn(() => ({ secret: 'search console data' }))

    await expect(callHandler(makeEvent(2, 'acme-site'), handler)).rejects.toThrow('Site not found')
    expect(handler).not.toHaveBeenCalled()
  })

  it('answers 404, not 403, so a guessed public id cannot confirm a site exists', async () => {
    const error = await callHandler(makeEvent(2, 'acme-site'), () => ({})).catch((e: unknown) => e)

    expect(statusCodeOf(error)).toBe(404)
  })

  it('does not run the handler when the site has no gscdump registration', async () => {
    const handler = vi.fn(() => ({}))

    const error = await callHandler(makeEvent(1, 'unregistered-site'), handler).catch((e: unknown) => e)

    expect(statusCodeOf(error)).toBe(404)
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes the resolved site and team through to the handler', async () => {
    const result = await callHandler(makeEvent(1, 'acme-site'), ({ site, team, event }) => ({
      publicId: (site as unknown as FakeSite).publicId,
      teamId: (team as unknown as { team: { teamId: number } }).team.teamId,
      sameEvent: event.context.siteIdParam,
    }))

    expect(result).toEqual({ publicId: 'acme-site', teamId: 1, sameEvent: 'acme-site' })
  })
})
