<script setup lang="ts">
import type { ProUserMenuItem, ProUserMenuTopLink } from '#layers/pro-saas/app/composables/useProUserMenu'

const props = defineProps<{
  openLicense: () => void
  topLink?: ProUserMenuTopLink
}>()

const emit = defineEmits<{
  navigate: []
}>()

const { items } = useProUserMenu({
  openLicense: () => props.openLicense(),
  topLink: props.topLink,
})

function handleSelect(item: ProUserMenuItem, event: Event) {
  if (item.onSelect)
    item.onSelect(event)
  emit('navigate')
}
</script>

<template>
  <div>
    <USeparator class="my-4" />
    <nav class="space-y-0.5">
      <template v-for="(group, gIdx) in items" :key="gIdx">
        <USeparator v-if="gIdx > 0" class="my-2" />
        <template v-for="(item, iIdx) in group" :key="`${gIdx}-${iIdx}`">
          <NuxtLink
            v-if="item.to && !item.onSelect"
            :to="item.to"
            :external="item.to === '/auth/logout'"
            class="flex items-center gap-2 px-1 py-1.5 rounded text-sm transition-colors w-full"
            :class="item.color === 'error' ? 'text-error hover:bg-error/10' : 'text-muted hover:text-default hover:bg-elevated'"
            @click="emit('navigate')"
          >
            <ProNavIcon v-if="item.icon" :icon="item.icon" />
            <span class="flex-1">{{ item.label }}</span>
            <UBadge
              v-if="item.badge"
              :color="item.badgeColor || 'neutral'"
              variant="solid"
              size="sm"
            >
              {{ item.badge }}
            </UBadge>
          </NuxtLink>
          <button
            v-else
            type="button"
            class="flex items-center gap-2 px-1 py-1.5 rounded text-sm transition-colors text-muted hover:text-default hover:bg-elevated w-full text-left"
            @click="handleSelect(item, $event)"
          >
            <ProNavIcon v-if="item.icon" :icon="item.icon" />
            <span class="flex-1">{{ item.label }}</span>
          </button>
        </template>
      </template>
    </nav>
  </div>
</template>
