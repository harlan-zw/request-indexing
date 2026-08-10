<script setup lang="ts">
import ProSubscriptionShell from '#layers/pro-saas-billing/app/components/pro/ProSubscriptionShell.vue'

const { session } = useUserSession()

const navigation = [
  { label: 'Dashboard', icon: 'i-lucide-layout-dashboard', to: '/pro/dashboard' },
  { label: 'Account', icon: 'i-lucide-user', to: '/pro/dashboard/account' },
  { label: 'Teams', icon: 'i-lucide-users', to: '/pro/dashboard/teams' },
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar id="pro-dashboard-sidebar" collapsible>
      <template #header>
        <NuxtLink to="/pro/dashboard" class="font-semibold text-highlighted">
          Request Indexing Pro
        </NuxtLink>
      </template>

      <ProWorkspaceSwitcher />
      <UNavigationMenu orientation="vertical" :items="navigation" />

      <template #footer>
        <div class="flex items-center gap-2 min-w-0">
          <UAvatar
            :src="session?.user?.avatarUrl ?? undefined"
            :alt="session?.user?.name ?? undefined"
            size="xs"
          />
          <span class="text-sm text-muted truncate">{{ session?.user?.name }}</span>
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel id="pro-dashboard-content">
      <template #body>
        <ProSubscriptionShell />
        <UContainer class="w-full py-6">
          <slot />
        </UContainer>
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
