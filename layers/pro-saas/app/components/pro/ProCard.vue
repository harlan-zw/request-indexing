<script setup lang="ts">
import type { VNode } from 'vue'
const {
  size = 'md',
} = defineProps<{
  title?: string
  description?: string
  divided?: boolean
  /** 'default' = solid bg-elevated (forms, settings). 'subtle' = translucent bg (data displays, lists). */
  variant?: 'default' | 'subtle'
  /** 'xs' = tight (inline/nested). 'sm' = compact (lists, dense tables). 'md' = default. 'lg' = spacious (hero/feature cards). */
  size?: 'xs' | 'sm' | 'md' | 'lg'
}>()

const slots = defineSlots<{
  default?: () => VNode[]
  header?: () => VNode[]
}>()

const headerClass = {
  xs: 'px-2.5 py-2',
  sm: 'px-3 sm:px-4 py-3',
  md: 'px-4 sm:px-6 py-4',
  lg: 'px-6 sm:px-8 py-5',
}[size]

const bodyClass = {
  xs: 'p-2.5',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
}[size]

const bodyDividedClass = {
  xs: 'divide-y divide-[var(--ui-border)] [&>*]:p-2.5',
  sm: 'divide-y divide-[var(--ui-border)] [&>*]:p-3 [&>*]:sm:p-4',
  md: 'divide-y divide-[var(--ui-border)] [&>*]:p-4 [&>*]:sm:p-6',
  lg: 'divide-y divide-[var(--ui-border)] [&>*]:p-6 [&>*]:sm:p-8',
}[size]

const titleClass = {
  xs: 'text-xs font-semibold text-default',
  sm: 'text-sm font-semibold text-default',
  md: 'font-semibold text-default',
  lg: 'text-lg font-semibold text-default',
}[size]
</script>

<template>
  <div class="flex flex-col">
    <div
      class="relative overflow-hidden rounded-xl border border-default flex flex-col flex-1"
      :class="[
        variant === 'subtle' ? 'bg-[var(--ui-bg-elevated)]/5' : 'bg-[var(--ui-bg-elevated)]/35',
      ]"
    >
      <!-- Header slot -->
      <div v-if="slots.header" class="relative border-b border-default shrink-0" :class="headerClass">
        <slot name="header" />
      </div>
      <!-- Auto header from title/description -->
      <div v-else-if="title" class="relative border-b border-default shrink-0" :class="headerClass">
        <h3 :class="titleClass">
          {{ title }}
        </h3>
        <p v-if="description" class="text-sm text-muted mt-1">
          {{ description }}
        </p>
      </div>

      <div
        data-card-body class="relative flex-1 flex flex-col"
        :class="[divided ? bodyDividedClass : bodyClass]"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
