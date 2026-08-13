<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { createLogoutHandler } from '~~/layers/core/app/composables/auth'

const { toggle = true } = defineProps<{
  toggle?: boolean
}>()

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
      { type: 'label', label: user.value?.email ?? '' },
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
  <UDashboardNavbar :toggle="toggle">
    <template #left>
      <slot />
    </template>
    <template #right>
      <div class="flex items-center gap-2">
        <UColorModeButton size="sm" class="min-h-11 min-w-11" />
        <UDropdownMenu :items="authDropdownItems" :content="{ align: 'end' }">
          <button aria-label="Open account menu" class="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md px-1 py-1 transition-colors hover:bg-elevated">
            <UAvatar :src="user?.avatarUrl || undefined" :alt="user?.name || user?.email || 'Account'" size="sm" />
            <UIcon name="i-heroicons-chevron-down" class="size-4 text-dimmed" />
          </button>
        </UDropdownMenu>
      </div>
    </template>
  </UDashboardNavbar>
</template>
