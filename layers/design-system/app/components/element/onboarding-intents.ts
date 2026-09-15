// The onboarding "How can we help?" options — display data only (id/label/icon),
// ordered. Lives in design-system (alongside the UiWizard* family + the in-memory
// onboarding service) so both the live pro flow and the brand-kit showcase render
// the same list. The app maps id → internal focus separately (teams/create.vue).
export interface OnboardingIntent {
  id: string
  label: string
  icon: string
}

export const ONBOARDING_INTENTS: OnboardingIntent[] = [
  { id: 'competitors', label: 'Beat my competitors', icon: 'chart-line' },
  { id: 'visitors', label: 'Get more visitors', icon: 'search' },
  { id: 'technical', label: 'Improve technical SEO', icon: 'shield-check' },
  { id: 'ai', label: 'Show up in AI answers', icon: 'bot' },
  { id: 'recover', label: 'Recover lost traffic', icon: 'i-lucide-rotate-ccw' },
  { id: 'speed', label: 'Speed up my site', icon: 'i-lucide-gauge' },
  { id: 'authority', label: 'Earn backlinks & mentions', icon: 'i-lucide-megaphone' },
]
