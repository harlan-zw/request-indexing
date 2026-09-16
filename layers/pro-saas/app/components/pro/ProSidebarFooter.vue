<script setup lang="ts">
// Ported from nuxtseo.com's `ProSidebarFooter.vue`: avatar and name open the
// two-column user menu, the colour mode toggle sits beside it.
import { UAvatar, UColorModeButton, UDropdownMenu, UiIcon, UiNavIcon } from '#components'
import { useProUserMenu } from '../../composables/useProUserMenu'
import ProTeamAvatar from './ProTeamAvatar.vue'

const { singleSite = false } = defineProps<{ singleSite?: boolean }>()

const { session } = useUserSession()
const { items, menuUi } = useProUserMenu({ singleSite: () => singleSite })
</script>

<template>
  <div class="flex items-center gap-1">
    <UDropdownMenu
      :items="items"
      :content="{ side: 'top', align: 'start', sideOffset: 12, collisionPadding: 12 }"
      :ui="menuUi"
      class="min-w-0 flex-1"
    >
      <button
        type="button"
        class="flex min-h-11 w-full cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:min-h-0"
      >
        <UAvatar :src="session?.user?.avatarUrl ?? undefined" alt="" size="2xs" />
        <span class="min-w-0 flex-1 truncate text-left text-sm font-medium text-default">
          {{ session?.user?.name ?? 'Account' }}
        </span>
        <UiIcon name="more" class="size-3.5 shrink-0 text-dimmed" aria-hidden="true" />
      </button>
      <template #item-leading="{ item }">
        <ProTeamAvatar v-if="item.workspaceTeam" :team="item.workspaceTeam" size="xs" class="shrink-0" />
        <UiNavIcon v-else-if="item.icon" :icon="item.icon" class="shrink-0" />
      </template>
      <template #item-trailing="{ item }">
        <UiIcon v-if="item.workspaceActive" name="check" class="size-4 shrink-0 text-default" aria-hidden="true" />
      </template>
    </UDropdownMenu>
    <UColorModeButton size="xs" variant="ghost" color="neutral" class="shrink-0" />
  </div>
</template>
