// Post-hook listener: anchor point for cache invalidation on plan transitions.
//
// Today no caches exist for lighthouse quota / chat token budget / report tier
// eligibility — tier reads happen live on every request. This plugin is the
// architectural anchor: when each cache lands, wire its bust here rather than
// hunting for the right spot.

export default defineProListener('pro:subscription:changed', async ({ teamId, oldPlan, newPlan, status }) => {
  // TODO(layer-hook): pro-perf lighthouse_quota cache bust when introduced.
  // TODO(layer-hook): pro-chat token-budget cache bust when introduced.
  // TODO(layer-hook): pro-reports tier-eligibility cache bust when introduced.
  void teamId
  void oldPlan
  void newPlan
  void status
})
