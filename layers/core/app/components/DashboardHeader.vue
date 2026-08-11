<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { createLogoutHandler } from '~~/layers/core/app/composables/auth'

const { user } = useUserSession()
const logout = createLogoutHandler()
const router = useRouter()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')

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
      { type: 'label', label: user.value.email },
    ],
    [
      { label: 'Account', to: '/account', icon: 'i-heroicons-user-circle' },
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
  <UDashboardNavbar>
    <template #left>
      <slot />
    </template>
    <template #right>
      <div class="flex items-center gap-2">
        <UColorModeButton size="sm" />
        <UDropdownMenu :items="authDropdownItems" :content="{ align: 'end' }">
          <button class="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-elevated transition-colors">
            <UAvatar :src="user.picture" size="sm" />
            <UIcon name="i-heroicons-chevron-down" class="size-4 text-dimmed" />
          </button>
        </UDropdownMenu>
      </div>
    </template>
  </UDashboardNavbar>
</template>
