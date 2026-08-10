import type { Ref } from 'vue'
// Maps indexing scope + GSC sync into the FeatureDataState contract.
// Reuses useProGscStatus for the GSC base layer; adds indexing-scope as a
// distinct 'partial' state.

import type { FeatureDataState } from '../../../../pro-shell/shared/types'
import { useGscFeatureDataState } from '#layers/pro-gsc/app/composables/useGscFeatureDataState'
import { useProGoogleScopes } from '#layers/pro-saas-auth/app/composables/useProGoogleScopes'

export function useIndexingFeatureState(siteId: Ref<string>): Ref<FeatureDataState> {
  const { data: gscProperties } = useLazyFetch('/api/pro/gsc-properties', {
    key: 'pro:gsc-properties',
  })
  const { hasIndexingScope } = useProGoogleScopes(() => gscProperties.value?.googleScopes)

  return useGscFeatureDataState(siteId, {
    beforeMinimumData() {
      if (gscProperties.value?.googleScopes && !hasIndexingScope.value)
        return { status: 'partial', missing: ['indexing-scope'] }
    },
  })
}
