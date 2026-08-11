export interface ProSaasFeatures {
  accountDeletion: boolean
  api: boolean
  feedback: boolean
  googleSignIn: boolean
  invitations: boolean
  onboarding: boolean
  profilePhotos: boolean
  teamApiTokens: boolean
  teams: boolean
}

export const defaultProSaasFeatures = {
  accountDeletion: true,
  api: true,
  feedback: false,
  googleSignIn: true,
  invitations: true,
  onboarding: true,
  profilePhotos: false,
  teamApiTokens: true,
  teams: true,
} as const satisfies ProSaasFeatures

export type ProSaasFeature = keyof ProSaasFeatures

export function resolveProSaasFeatures(overrides: Partial<ProSaasFeatures> = {}): ProSaasFeatures {
  return { ...defaultProSaasFeatures, ...overrides }
}

export function proSaasFeatureEnabled(
  features: Partial<ProSaasFeatures> | undefined,
  feature: ProSaasFeature,
): boolean {
  return resolveProSaasFeatures(features)[feature]
}
