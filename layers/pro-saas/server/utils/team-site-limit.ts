// One number for how many Search Console sites a team may connect.
//
// It used to live in three places that disagreed: the Sites page said "up to 6",
// the helper text said "up to 3", and `TeamSiteSelector` hard-coded its own 3.
// Nothing enforced any of them on the server, which is how a team reached the
// "5/3" state with the progress bar overflowing and Save still enabled.
//
// `/api/sites/preview` returns this as `maxSites` so the UI never carries its
// own copy, and both `/api/pro/sites` and `/api/teams/currentTeam` reject a
// selection that exceeds it, so the client cannot be the only thing standing
// between a user and an over-limit team.
// nuxtseo.com gates this on the plan: a pre-billing team registers up to
// `ONBOARDING_SITE_CAP`, which is its `TRIAL_SITE_CAP` of 5. There is no billing
// here, so that number is the flat cap.
export const MAX_TEAM_SITES = 5

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
