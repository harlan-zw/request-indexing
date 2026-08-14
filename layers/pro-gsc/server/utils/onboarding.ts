// Lightweight onboarding state stub backed by useStorage('cache'). Used by
// auto-link-gsc + reconcile-gscdump-onboarding to surface "GSC connected /
// site linked" hints in the dashboard. Schema is intentionally open; the
// dashboard reads whichever keys it understands.
//
// V1 will replace this with a richer per-user onboarding state machine if
// the onboarding flow grows more steps.

export async function updateOnboardingState(userId: number, patch: Record<string, unknown>): Promise<void> {
  const storage = useStorage('cache')
  const key = `onboarding:${userId}`
  const existing = (await storage.getItem(key)) as Record<string, unknown> | null
  const next: Record<string, unknown> = { ...(existing ?? {}), ...patch }
  await storage.setItem(key, next)
}

export async function readOnboardingState(userId: number): Promise<Record<string, unknown>> {
  const storage = useStorage('cache')
  const key = `onboarding:${userId}`
  return ((await storage.getItem(key)) as Record<string, unknown> | null) ?? {}
}
