// Sidebar setup chips, shared by every renderer of the Site nav so two
// renderings of the same state cannot drift.
//
// nuxtseo.com derives a chip per concern from its analytics, DataForSEO and
// assessment modules. None of those exist here, and importing them is what a
// port would get wrong, so the signals they feed are stubbed to `null` and
// named below. This app has exactly one setup signal: whether the account has
// connected Google Search Console.

import type { ProSiteNavLink } from './useProSiteNav'
import { computed } from 'vue'

export interface ProNavSetupChip {
  /** One short imperative word. Anything longer is a layout bug. */
  verb: string
  tooltip: string
  tone?: 'primary' | 'warning'
}

export interface ProNavSetupBadges {
  /** Search Console is not connected for this account. */
  gscSetup: ProNavSetupChip | null
}

export function useProNavSetupBadges() {
  const { session } = useUserSession()
  const gscConnected = computed(() => !!(session.value as { gscConnected?: boolean } | undefined)?.gscConnected)

  const gscSetup = computed<ProNavSetupChip | null>(() => gscConnected.value
    ? null
    : {
        verb: 'Connect',
        tooltip: 'Connect Google Search Console to load this site\'s search data',
      })

  // Stubs. nuxtseo.com resolves these from modules this app does not carry:
  // `web-analytics` (pro-analytics), `mentions` (pro-dataforseo) and the open
  // action count (pro-actions). Declared so the decorator below keeps the same
  // shape as upstream, and so adding one later is a single edit here.
  const analyticsSetup = computed<ProNavSetupChip | null>(() => null)
  const mentionsSetup = computed<ProNavSetupChip | null>(() => null)
  const openActionBadge = computed<string | undefined>(() => undefined)

  return { gscConnected, gscSetup, analyticsSetup, mentionsSetup, openActionBadge }
}

/**
 * Hangs the resolved chips on the rows that own them. The Search Console chip
 * lands on the Search Performance Overview row, which is where the reader goes
 * to connect.
 */
export function decorateSiteNavLink(
  link: ProSiteNavLink,
  badges: { gscSetup?: ProNavSetupChip | null },
): ProSiteNavLink {
  if (link.id === 'search-console' && badges.gscSetup)
    return { ...link, setup: badges.gscSetup, pending: false, pendingTooltip: undefined }
  return link
}
