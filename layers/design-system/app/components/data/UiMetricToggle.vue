<script setup lang="ts">
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { UiIcon, UiTooltip } from '#components'
import { vizBgColor } from '../../composables/dataVizColors'

export interface MetricToggleOption {
  key: string
  label: string
  color: string
  icon?: string
  /** What this metric means, shown on hover/focus. Icon-only toggles are unreadable without it. */
  tooltip?: string
  special?: boolean
}

const { options, iconOnly = false } = defineProps<{
  options: MetricToggleOption[]
  /** Render icons only (no labels) in a tighter bordered segment. Label moves to a tooltip/aria. */
  iconOnly?: boolean
}>()

const emit = defineEmits<{
  toggle: [key: string]
}>()

const modelValue = defineModel<string[]>({ required: true })

function onUpdate(value: unknown) {
  const next = Array.isArray(value) ? value.filter(v => typeof v === 'string') : []
  // Surface the single key that flipped so consumers can react per-metric.
  const changed = next.find(k => !modelValue.value.includes(k))
    ?? modelValue.value.find(k => !next.includes(k))
  if (changed)
    emit('toggle', changed)
  modelValue.value = next
}

function isActive(key: string) {
  return modelValue.value.includes(key)
}
</script>

<template>
  <ToggleGroupRoot
    :model-value="modelValue"
    type="multiple"
    :class="iconOnly ? 'flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--ui-bg-elevated)]/60 border border-default' : 'flex gap-1'"
    @update:model-value="onUpdate"
  >
    <!-- `triggerAs="child"` keeps the toggle itself the trigger — an extra
         wrapper span would break the segment's flex row and the hit area. -->
    <UiTooltip
      v-for="opt in options"
      :key="opt.key"
      :title="opt.label"
      :description="opt.tooltip"
      :text="opt.tooltip ? undefined : opt.label"
      trigger-as="child"
      size="sm"
    >
      <ToggleGroupItem
        :value="opt.key"
        class="cursor-pointer inline-flex items-center font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="[
          iconOnly ? 'justify-center size-11 sm:size-7 rounded-md' : 'gap-1.5 px-2 py-1 min-h-11 sm:min-h-0 text-mini rounded-md border',
          isActive(opt.key)
            ? (iconOnly ? 'bg-default text-default' : 'border-accented bg-elevated text-default')
            : (iconOnly ? 'text-dimmed hover:text-default' : 'border-transparent text-dimmed hover:text-muted hover:bg-accented'),
          opt.special && !isActive(opt.key) && 'ring-1 ring-[var(--ui-primary)]/50',
        ]"
        :aria-label="`Toggle ${opt.label}`"
      >
        <!-- Consumer-rendered glyph (e.g. `UiSeverityMarker`) for options whose
             identity isn't a named icon or a metric colour — falls back to the
             built-in icon/dot so every existing caller is unaffected. -->
        <slot name="icon" :option="opt" :active="isActive(opt.key)">
          <UiIcon v-if="opt.icon" :name="opt.icon" class="size-3.5" />
          <span
            v-else
            class="size-1.5 rounded-full shrink-0 transition-colors duration-150"
            :class="isActive(opt.key) ? vizBgColor(opt.color) : 'bg-muted'"
          />
        </slot>
        <template v-if="!iconOnly">
          {{ opt.label }}
        </template>
      </ToggleGroupItem>
    </UiTooltip>
  </ToggleGroupRoot>
</template>
