import { describe, expect, it } from 'vitest'
import { dashboardSiteHref } from './dashboard-site-link'

describe('dashboardSiteHref', () => {
  it('builds a link from a site id and a sub-path', () => {
    expect(dashboardSiteHref('s_kv1109', 'overview')).toBe('/dashboard/site/s_kv1109/overview')
  })

  it('percent-encodes a public id rather than splitting the path', () => {
    expect(dashboardSiteHref('s_a/b', 'overview')).toBe('/dashboard/site/s_a%2Fb/overview')
  })
})
