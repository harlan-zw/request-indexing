<script setup lang="ts" generic="T extends string | number = string">
import { ToggleGroupItem, ToggleGroupRoot } from 'reka-ui'
import { UiIcon, UiTooltip } from '#components'

export interface TogglePillOption<T extends string | number = string> {
  value: T
  label: string
  icon?: string
  disabled?: boolean
  tooltip?: string
}

const { options, label } = defineProps<{
  options: TogglePillOption<T>[]
  /** Accessible name for the segmented control (screen-reader only). */
  label?: string
}>()

const modelValue = defineModel<T>({ required: true })

// reka ToggleGroup (type=single) round-trips the value through a DOM attr, so
// it always emits a string; map back to the original option so a numeric `T`
// keeps its type. `null`/deselect is swallowed — this is a required single-select.
function onUpdate(value: unknown) {
  if (typeof value !== 'string')
    return
  const match = options.find(o => String(o.value) === value)
  if (match)
    modelValue.value = match.value
}

// Canonical segmented-control proportions come from the Search Console
// portfolio toolbar: a fixed 28px desktop item inside a bordered, inset shell.
// Keeping the dimensions here prevents each dashboard concern from drifting.
const itemClass = 'h-11 sm:h-7 px-2.5 inline-flex items-center justify-center gap-1.5 text-sm font-medium rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary'
</script>

<template>
  <ToggleGroupRoot
    :model-value="String(modelValue)"
    type="single"
    :aria-label="label"
    class="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--ui-bg-elevated)]/60 border border-default"
    @update:model-value="onUpdate"
  >
    <template v-for="opt in options" :key="String(opt.value)">
      <UiTooltip v-if="opt.tooltip" :text="opt.tooltip" :delay-duration="200">
        <ToggleGroupItem
          :value="String(opt.value)"
          :disabled="opt.disabled"
          class="data-disabled:text-dimmed/60 data-disabled:cursor-not-allowed cursor-pointer"
          :class="[
            itemClass,
            modelValue === opt.value
              ? 'bg-default text-default shadow-sm'
              : 'text-muted hover:text-default',
          ]"
        >
          <UiIcon v-if="opt.icon" :name="opt.icon" class="size-3.5" aria-hidden="true" />
          {{ opt.label }}
        </ToggleGroupItem>
      </UiTooltip>
      <ToggleGroupItem
        v-else
        :value="String(opt.value)"
        :disabled="opt.disabled"
        class="data-disabled:text-dimmed/60 data-disabled:cursor-not-allowed cursor-pointer"
        :class="[
          itemClass,
          modelValue === opt.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default',
        ]"
      >
        <UiIcon v-if="opt.icon" :name="opt.icon" class="size-3.5" aria-hidden="true" />
        {{ opt.label }}
      </ToggleGroupItem>
    </template>
  </ToggleGroupRoot>
</template>
