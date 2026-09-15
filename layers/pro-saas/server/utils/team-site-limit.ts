// One number for how many Search Console sites a team may connect.
//
// It used to live in three places that disagreed: the Sites page said "up to 6",
// the helper text said "up to 3", and `TeamSiteSelector` hard-coded its own 3.
// Nothing enforced any of them on the server, which is how a team reached the
// "5/3" state with the progress bar overflowing and Save still enabled.
//
// `/api/sites/preview` returns this as `maxSites` so the UI never carries its
// own copy, and `/api/teams/currentTeam` rejects a selection that exceeds it so
// the client cannot be the only thing standing between a user and an over-limit
// team.
export const MAX_TEAM_SITES = 3

export interface SiteSelectionOverLimit {
  _tag: 'OverLimit'
  selected: number
  max: number
}

export type SiteSelectionCheck
  = | { _tag: 'WithinLimit' }
    | SiteSelectionOverLimit

export function checkTeamSiteSelection(selectedCount: number, max: number = MAX_TEAM_SITES): SiteSelectionCheck {
  return selectedCount > max
    ? { _tag: 'OverLimit', selected: selectedCount, max }
    : { _tag: 'WithinLimit' }
}
