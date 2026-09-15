import { describe, expect, it } from 'vitest'
import { mapLegacyDashboardPath } from './legacy-dashboard-routes'

describe('mapLegacyDashboardPath', () => {
  it('ignores a path that was never on the old tree', () => {
    expect(mapLegacyDashboardPath('/')).toBeNull()
    expect(mapLegacyDashboardPath('/pro/dashboard')).toBeNull()
    expect(mapLegacyDashboardPath('/dashboards-explained')).toBeNull()
  })

  it('moves the roster and the team pages across unchanged', () => {
    expect(mapLegacyDashboardPath('/dashboard')).toBe('/pro/dashboard')
    expect(mapLegacyDashboardPath('/dashboard/team/members')).toBe('/pro/dashboard/team/members')
    expect(mapLegacyDashboardPath('/dashboard/web-indexing')).toBe('/pro/dashboard/web-indexing')
  })

  it('renames the site segment and keeps the site', () => {
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109')).toBe('/pro/dashboard/sites/kv1109/search-console')
  })

  it.each([
    'overview',
    'keywords',
    'keyword-insights',
    'pages',
    'countries',
    'analysis',
    'data',
  ])('folds the %s page into Search Console', (page) => {
    expect(mapLegacyDashboardPath(`/dashboard/site/kv1109/${page}`)).toBe('/pro/dashboard/sites/kv1109/search-console')
  })

  it('folds an entity detail page into the list it came from', () => {
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109/keywords/nuxt%20seo'))
      .toBe('/pro/dashboard/sites/kv1109/search-console')
  })

  it('sends the pages that kept a page of their own to their new parent', () => {
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109/sitemaps')).toBe('/pro/dashboard/sites/kv1109/indexing/sitemaps')
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109/web-indexing')).toBe('/pro/dashboard/sites/kv1109/indexing/submit')
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109/settings')).toBe('/pro/dashboard/sites/kv1109/settings')
    expect(mapLegacyDashboardPath('/dashboard/site/kv1109/usages')).toBe('/pro/dashboard/sites/kv1109/usages')
  })

  it('sends the account page to its place in the one tree', () => {
    expect(mapLegacyDashboardPath('/account')).toBe('/pro/dashboard/account')
    expect(mapLegacyDashboardPath('/account/identities')).toBe('/pro/dashboard/account')
  })
})
