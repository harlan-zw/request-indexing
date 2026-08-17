<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'
import DashboardShell from './_DashboardShell.vue'

const router = useRouter()
const route = useRoute()
const { session } = useUserSession()

const isOnWelcome = computed(() => router.currentRoute.value.path === ONBOARDING_ROUTE)

// A session with no team is an expected state, not a fault, so it is resolved
// into `TeamOnboarding` rather than read through. Both absent states end up in
// the same place: onboarding.
const onboarding = computed(() => resolveTeamOnboarding(session.value))

watch([isOnWelcome, onboarding], ([val, state]) => {
  if (!val && needsOnboarding(state))
    router.push(ONBOARDING_ROUTE)
}, { immediate: true })

const pageTitle = computed(() => String(route.meta.subTitle || route.meta.title || 'Account'))
const pageIcon = computed(() => typeof route.meta.icon === 'string' ? route.meta.icon : undefined)

const accountLinks: NavigationMenuItem[] = [
  { label: 'Profile', to: '/account', icon: 'i-heroicons-user-circle' },
]

const teamLinks: NavigationMenuItem[] = [
  { label: 'Members', to: '/dashboard/team/members', icon: 'i-heroicons-users' },
  { label: 'Settings', to: '/dashboard/team/settings', icon: 'i-heroicons-cog' },
]

const supportLinks: NavigationMenuItem[] = [
  { icon: 'i-ph-envelope-open-duotone', label: 'Email', to: 'mailto:harlan@harlanzw.com', target: '_blank' },
  { icon: 'i-ph-chat-centered-text-duotone', label: 'Discord', to: 'https://discord.gg/275MBUBvgP', target: '_blank' },
  { icon: 'i-ph-github-logo', label: 'Submit a bug', to: 'https://github.com/harlan-zw/request-indexing/issues/new/choose', target: '_blank' },
]

const groups = [{ id: 'links', label: 'Go to', items: [] }]
</script>

<template>
  <DashboardShell content-class="p-0">
    <template #brand>
      <NuxtLink to="/dashboard" class="inline-flex min-h-11 items-center rounded-md text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <OgBrand :size="26" wordmark semantic />
      </NuxtLink>
    </template>

    <template #mobileNav>
      <div class="flex min-w-0 items-center justify-between gap-3">
        <div class="min-w-0 truncate font-title text-base font-semibold tracking-tight text-highlighted">
          {{ pageTitle }}
        </div>
        <DashboardHeader :toggle="false" class="h-auto border-none px-0 sm:px-0" />
      </div>
    </template>

    <template #sidebar>
      <UButton icon="i-ph-arrow-u-down-left" color="neutral" variant="ghost" size="sm" to="/dashboard" class="min-h-10 justify-start">
        Back to dashboard
      </UButton>

      <div>
        <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Account
        </div>
        <UNavigationMenu orientation="vertical" :items="accountLinks" />
      </div>

      <div class="mt-auto border-t border-default pt-4">
        <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Team Settings
        </div>
        <UNavigationMenu orientation="vertical" :items="teamLinks" />
      </div>
    </template>

    <template #footer>
      <div v-if="session?.team" class="flex min-w-0 items-center gap-2 px-2">
        <UAvatar
          :src="session.user?.avatarUrl || undefined"
          :alt="session.user?.name || session.user?.email || 'Account'"
          size="xs"
        />
        <div class="min-w-0">
          <div class="truncate text-xs text-muted">
            Team
          </div>
          <div class="truncate text-sm font-medium text-highlighted">
            {{ session.team.name }}
          </div>
        </div>
      </div>
    </template>

    <header class="sticky top-0 z-20 border-b border-default bg-default/85 backdrop-blur-sm">
      <div class="dashboard-container flex min-h-16 items-center justify-between gap-4">
        <h1 class="flex min-w-0 items-center gap-2 font-title text-xl font-semibold tracking-tight text-highlighted">
          <UIcon v-if="pageIcon" :name="pageIcon" class="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span class="truncate">{{ pageTitle }}</span>
        </h1>
        <div class="hidden lg:block">
          <DashboardHeader :toggle="false" class="h-auto border-none px-0 sm:px-0" />
        </div>
      </div>
    </header>

    <div class="dashboard-container grid gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:py-8">
      <div class="min-w-0">
        <slot />
      </div>

      <aside class="lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-[var(--ui-radius)] border border-default bg-elevated/40">
          <div class="border-b border-default px-3 py-2 text-sm font-semibold text-highlighted">
            Get Help
          </div>
          <div class="p-1">
            <UNavigationMenu orientation="vertical" :items="supportLinks" />
          </div>
        </div>
      </aside>
    </div>

    <template #extras>
      <ClientOnly>
        <LazyUDashboardSearch :groups="groups" />
      </ClientOnly>
    </template>
  </DashboardShell>
</template>
