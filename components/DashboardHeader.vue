<script setup lang="ts">
import type { DropdownItem } from '@nuxt/ui/dist/runtime/types'
import { createLogoutHandler } from '~/composables/auth'

const { user } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()
// const color = useColorMode()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')
// const isOnDashboard = computed(() => router.currentRoute.value.path.startsWith('/dashboard'))

// const sites = ref(loggedIn.value ? await fetchSites().then(res => res.data.value?.sites) : [])

const authDropdownItems: DropdownItem[][] = computed(() => {
  if (isOnWelcome.value) {
    return [[
      {
        label: 'Logout',
        click: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ]]
  }
  return [
    [
      { label: 'Account', slot: 'account', to: '/account', icon: 'i-heroicons-user-circle' },
    ],
    user.value.access === 'pro'
      ? false
      : [
        // upgrade to pro item
          { label: 'Upgrade', slot: 'pro', to: '/account/upgrade', icon: 'i-heroicons-star' },
        ],
    [
      {
        label: 'Logout',
        click: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ],
  ].filter(Boolean)
})
</script>

<template>
  <UDashboardNavbar>
    <template #left>
      <slot />
    </template>
    <template #right>
      <div class="flex items-center">
        <UDropdown :items="authDropdownItems" mode="hover" class="flex items-center">
          <template #account="{ item }">
            <div class="flex flex-col w-full">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span class="truncate">{{ item.label }}</span>
              </div>
              <div class="text-gray-400 text-xs">
                {{ user.email }}
              </div>
            </div>
          </template>
          <template #pro="{ item }">
            <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span class="truncate">{{ item.label }}</span>
            <UBadge label="0 left" color="purple" variant="subtle" class="ml-0.5" />
          </template>
          <UAvatar :src="user.picture" />
          <div class="ml-2 flex items-center">
            <UBadge v-if="user.access === 'pro'" label="Pro" color="purple" variant="subtle" class="ml-0.5" />
          </div>
          <UButton
            icon="i-heroicons-chevron-down"
            color="gray"
            size="xs"
            variant="ghost"
          />
        </UDropdown>
      </div>
    </template>
  </UDashboardNavbar>
</template>
