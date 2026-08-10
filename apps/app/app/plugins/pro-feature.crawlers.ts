/**
 * V1 pilot: register the "crawlers" feature with pro-shell.
 *
 * Surfaces AI crawler hits observed by the edge worker (worker/) at
 * /dashboard/site/[slug]/crawlers. The data is written from the worker into
 * the `crawler_hits` table; this feature page reads it back.
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('pro:feature', (registry) => {
    registry.add({
      id: 'crawlers',
      label: 'AI Crawlers',
      icon: 'i-ph-robot-duotone',
      group: 'ai',
      subscription: 'free',
      stability: 'alpha',
      lockedDescription: 'AI crawler observability requires a Pro plan.',
      lockedUnlockLabel: 'Upgrade to Pro',
      lockedUnlockTo: '/account/upgrade',
    })
  })
})
