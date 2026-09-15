export interface ProSaasFeatures {
  accountDeletion: boolean
  api: boolean
  feedback: boolean
  githubSignIn: boolean
  googleSignIn: boolean
  invitations: boolean
  onboarding: boolean
  profilePhotos: boolean
  teams: boolean
}

export const defaultProSaasFeatures = {
  accountDeletion: true,
  api: true,
  feedback: false,
  // On, like nuxtseo.com. A GitHub-only account cannot read Search Console, so
  // the wizard's first step tells it to add Google before it can go further;
  // that is a better answer than hiding an identity people already have.
  githubSignIn: true,
  googleSignIn: true,
  invitations: true,
  onboarding: true,
  profilePhotos: false,
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
