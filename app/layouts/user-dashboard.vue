<script lang="ts" setup>
import type { NavigationMenuItem } from '@nuxt/ui'

const router = useRouter()
const { session } = useUserSession()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')

watch(isOnWelcome, (val) => {
  if (!val && !session.value.team.onboardedStep)
    router.push('/dashboard/team/setup')
}, { immediate: true })

const onlyDashboardLinks = computed<NavigationMenuItem[]>(() => [
  { label: 'Profile', to: '/account', icon: 'i-heroicons-user-circle' },
  { label: 'Pro', to: '/account/upgrade', icon: 'i-heroicons-star' },
])

const supportLinks: NavigationMenuItem[] = [
  { icon: 'i-ph-envelope-open-duotone', label: 'Email', to: 'mailto:harlan@harlanzw.com', target: '_blank' },
  { icon: 'i-ph-chat-centered-text-duotone', label: 'Discord', to: 'https://discord.gg/275MBUBvgP', target: '_blank' },
  { icon: 'i-ph-github-logo', label: 'Submit a bug', to: 'https://github.com/harlan-zw/request-indexing/issues/new/choose', target: '_blank' },
]

const groups = [{ id: 'links', label: 'Go to', items: [] }]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      id="user-dashboard-sidebar"
      resizable
      collapsible
      :default-size="20"
      :min-size="15"
      :max-size="30"
    >
      <template #header>
        <NuxtLink to="/dashboard" class="flex items-center gap-2 group px-2">
          <div class="text-highlighted font-title font-semibold whitespace-nowrap text-lg" style="letter-spacing: -1.5px;">
            Request Indexing
          </div>
        </NuxtLink>
      </template>

      <UNavigationMenu orientation="vertical" :items="onlyDashboardLinks" />
    </UDashboardSidebar>

    <UDashboardPanel id="user-dashboard-content">
      <template #header>
        <DashboardHeader />
      </template>
      <template #body>
        <UPage class="px-6">
          <slot />
          <template #right>
            <UPageAside>
              <div class="mb-2 text-sm font-semibold">
                Get Help
              </div>
              <UNavigationMenu orientation="vertical" :items="supportLinks" />
            </UPageAside>
          </template>
        </UPage>
      </template>
    </UDashboardPanel>

    <ClientOnly>
      <LazyUDashboardSearch :groups="groups" />
    </ClientOnly>
  </UDashboardGroup>
</template>
