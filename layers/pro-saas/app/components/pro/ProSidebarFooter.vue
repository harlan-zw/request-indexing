<script setup lang="ts">
import type { UserSession } from '#auth-utils'
import type { ProUserMenuTopLink } from '#layers/pro-saas/app/composables/useProUserMenu'

const props = defineProps<{
  session: UserSession | null | undefined
  openLicense: () => void
  topLink?: ProUserMenuTopLink
  /** Hide the workspace switcher even if the user has multiple teams (e.g. on docs layout). */
  hideWorkspaceSwitcher?: boolean
}>()

const { teams } = useCurrentWorkspace()

const { items: menuItems } = useProUserMenu({
  openLicense: () => props.openLicense(),
  topLink: props.topLink,
})
</script>

<template>
  <div class="space-y-3">
    <slot name="top" />
    <!-- Workspace switcher (Vercel-style pattern). Solo users see no switcher. -->
    <ProWorkspaceSwitcher v-if="!hideWorkspaceSwitcher && teams.length > 1" />
    <div class="flex items-center gap-1">
      <UDropdownMenu
        :items="menuItems"
        :content="{ side: 'right', align: 'end' }"
        :ui="{ content: 'min-w-48', itemLeadingIcon: 'hidden' }"
        class="flex-1 min-w-0"
      >
        <button class="flex items-center gap-2.5 w-full px-1 py-1 rounded-lg hover:bg-elevated transition-colors">
          <UAvatar
            :src="session?.user?.avatarUrl ?? undefined"
            :alt="session?.user?.name ?? undefined"
            size="xs"
          />
          <div class="flex-1 min-w-0 text-left">
            <p class="text-sm font-medium truncate text-default">
              {{ session?.user?.name }}
            </p>
          </div>
          <UIcon name="i-lucide-chevrons-up-down" class="size-3.5 text-dimmed shrink-0" aria-hidden="true" />
        </button>
        <template #item-leading="{ item }">
          <ProNavIcon v-if="item.icon" :icon="item.icon" class="shrink-0" />
        </template>
        <template #item-trailing="{ item }">
          <UBadge
            v-if="item.badge"
            :color="item.badgeColor || 'neutral'"
            variant="solid"
            size="sm"
          >
            {{ item.badge }}
          </UBadge>
        </template>
      </UDropdownMenu>
      <UColorModeButton size="xs" variant="ghost" color="neutral" class="shrink-0" />
    </div>
  </div>
</template>
