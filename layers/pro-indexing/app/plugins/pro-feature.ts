import { proFeatureSetup } from '#layers/pro-shell/app/utils/registry-factories'
import { useIndexingFeatureState } from '../internal/composables/useIndexingFeatureState'

/**
 * Registers the indexing feature with pro-shell.
 */
export default defineNuxtPlugin({
  name: 'pro-indexing:feature',
  setup: proFeatureSetup({
    features: [{
      id: 'indexing',
      label: 'Indexing Coverage',
      icon: 'i-lucide-database',
      group: 'health',
      integration: 'gsc-connected',
      stateResolver: useIndexingFeatureState,
      lockedDescription: 'See how Google indexes your site\'s pages. Identify issues blocking indexing.',
      lockedUnlockLabel: 'Connect GSC',
      lockedUnlockTo: '/pro/dashboard/search-console',
    }],
  }),
})
