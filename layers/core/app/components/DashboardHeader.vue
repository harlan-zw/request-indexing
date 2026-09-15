<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { createLogoutHandler } from '~~/layers/core/app/composables/auth'
import { ONBOARDING_ROUTE } from '#layers/pro-saas/shared/onboarding'

const { user } = useUserSession()
const logout = createLogoutHandler()
const router = useRouter()

const isOnWelcome = computed(() => router.currentRoute.value.path === ONBOARDING_ROUTE)

const authDropdownItems = computed<DropdownMenuItem[][]>(() => {
  if (isOnWelcome.value) {
    return [[
      {
        label: 'Logout',
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
        onSelect: () => logout(),
      },
    ]]
  }
  const groups: DropdownMenuItem[][] = [
    [
      { type: 'label', label: user.value?.email ?? '' },
    ],
    [
      { label: 'Account', to: '/pro/dashboard/account', icon: 'i-heroicons-user-circle' },
    ],
  ]
  groups.push([
    {
      label: 'Logout',
      icon: 'i-heroicons-arrow-left-end-on-rectangle',
      onSelect: () => logout(),
    },
  ])
  return groups
})
</script>

<template>
  <!-- A toolbar, not a page header. It used to wrap `UDashboardNavbar`, whose
       template always emits an `h1` for its (unset) title, so every page on
       this shell shipped two empty headings beside the real one. -->
  <div class="flex items-center justify-between gap-2">
    <slot />
    <div class="flex items-center gap-2">
      <UColorModeButton size="sm" class="min-h-11 min-w-11" />
      <UDropdownMenu :items="authDropdownItems" :content="{ align: 'end' }">
        <button aria-label="Open account menu" class="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-elevated">
          <UAvatar :src="user?.avatarUrl || undefined" :alt="user?.name || user?.email || 'Account'" size="sm" />
          <UIcon name="i-heroicons-chevron-down" class="size-4 text-dimmed" />
        </button>
      </UDropdownMenu>
    </div>
  </div>
</template>
