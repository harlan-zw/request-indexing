import { describe, expect, it } from 'vitest'
import { dashboardSiteHref } from './dashboard-site-link'

describe('dashboardSiteHref', () => {
  it('builds a link from a site id and a sub-path', () => {
    expect(dashboardSiteHref('s_kv1109', 'search-console')).toBe('/pro/dashboard/sites/s_kv1109/search-console')
  })

  it('percent-encodes a public id rather than splitting the path', () => {
    expect(dashboardSiteHref('s_a/b', 'search-console')).toBe('/pro/dashboard/sites/s_a%2Fb/search-console')
  })
})
