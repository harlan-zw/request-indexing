<script lang="ts" setup>
const {
  title,
  icon,
  badge,
  badgeStatus,
  to,
  actionLabel = 'View all',
} = defineProps<{
  title: string
  icon?: string
  badge?: string | number
  badgeStatus?: 'success' | 'error' | 'warning' | 'info' | 'neutral'
  tooltip?: string
  to?: string
  actionLabel?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-2">
      <ProNavIcon v-if="icon" :icon="icon" />
      <h2 class="text-[13px] font-semibold tracking-tight">
        <slot name="title">
          {{ title }}
        </slot>
      </h2>
      <UBadge
        v-if="badge != null"
        :color="badgeStatus === 'neutral' || !badgeStatus ? 'neutral' : badgeStatus"
        variant="soft"
        size="xs"
        class="tabular-nums"
      >
        {{ badge }}
      </UBadge>
      <UTooltip v-if="tooltip" :text="tooltip">
        <UIcon name="i-lucide-info" class="size-3 text-dimmed" />
      </UTooltip>
      <slot name="after-title" />
    </div>
    <slot name="action">
      <NuxtLink
        v-if="to"
        :to="to"
        class="text-xs text-muted hover:text-default transition-colors inline-flex items-center gap-1"
      >
        {{ actionLabel }}
        <UIcon name="i-lucide-arrow-right" class="size-3" />
      </NuxtLink>
    </slot>
  </div>
</template>
