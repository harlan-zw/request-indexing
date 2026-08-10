// Minimal Caller types stubbed locally inside pro-shell. The upstream
// pro-saas layer ships a richer Caller shape (subscription/team/auth-method);
// here we only need the plan enum that ProFeatureRegistration.subscription
// references. When pro-saas-billing lands, replace these with the canonical
// types from `#layers/pro-saas/shared/caller`.

export type CallerPlan = 'free' | 'starter' | 'pro' | 'lifetime'
