import type { ProSaasFeature, ProSaasFeatures } from '../../shared/features'
import { resolveProSaasFeatures } from '../../shared/features'

export function useProSaasFeatures() {
  const appConfig = useAppConfig() as { proSaas?: { features?: Partial<ProSaasFeatures> } }
  const features = computed<ProSaasFeatures>(() =>
    resolveProSaasFeatures(appConfig.proSaas?.features),
  )

  function enabled(feature: ProSaasFeature): boolean {
    return features.value[feature]
  }

  return {
    features,
    enabled,
  }
}
