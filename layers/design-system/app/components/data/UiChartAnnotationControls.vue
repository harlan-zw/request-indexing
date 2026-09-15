<script lang="ts" setup generic="K extends string">
import type { ChartAnnotationControlItem } from '../../utils/chartAnnotations'
import { computed } from 'vue'
import { UCheckbox, UiButton, UiIcon, UiPopover } from '#components'

const { items, dense = false } = defineProps<{
  items: readonly ChartAnnotationControlItem<K>[]
  /** Compact icon+chevron trigger for a joined toolbar pill (e.g. beside a metric toggle) instead of the standalone quiet button. */
  dense?: boolean
}>()

const emit = defineEmits<{
  toggle: [key: K, enabled: boolean]
}>()

const hiddenCount = computed(() => items.filter(item => !item.enabled).length)
const triggerLabel = computed(() => hiddenCount.value
  ? `Configure chart annotations, ${hiddenCount.value} hidden`
  : 'Configure chart annotations')
</script>

<template>
  <UiPopover :content="{ side: 'bottom', align: 'end' }">
    <button
      v-if="dense"
      type="button"
      data-annotation-controls
      :aria-label="triggerLabel"
      class="cursor-pointer inline-flex items-center justify-center gap-0.5 size-11 sm:size-7 rounded-md transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :class="hiddenCount ? 'text-primary' : 'text-dimmed hover:text-default'"
    >
      <UiIcon name="flag" class="size-3.5" aria-hidden="true" />
      <UiIcon name="chevron-down" class="size-2.5" aria-hidden="true" />
    </button>
    <UiButton
      v-else
      data-annotation-controls
      purpose="quiet"
      size="xs"
      icon="sliders"
      :aria-label="triggerLabel"
      :class="hiddenCount ? 'size-11 text-primary bg-primary/10 sm:size-8' : 'size-11 text-muted sm:size-8'"
    />

    <template #panel>
      <div data-annotation-controls-panel class="w-64 max-w-[calc(100vw-2rem)] p-3">
        <p class="px-1 pb-2 text-mini font-semibold uppercase tracking-wide text-muted">
          Show on charts
        </p>
        <div class="divide-y divide-default" role="group" aria-label="Annotation sources">
          <label
            v-for="item in items"
            :key="item.key"
            class="min-h-11 grid grid-cols-[1.5rem_minmax(0,1fr)_auto_auto] items-center gap-2 px-1 text-sm text-default cursor-pointer"
          >
            <span class="size-6 rounded-full bg-default ring-1 ring-default grid place-items-center text-muted" aria-hidden="true">
              <UiIcon :name="item.icon" class="size-3.5" />
            </span>
            <span class="min-w-0 truncate">{{ item.label }}</span>
            <span v-if="item.count != null" class="text-mini text-dimmed tabular-nums">
              {{ item.count }}
            </span>
            <UCheckbox
              :model-value="item.enabled"
              size="sm"
              :aria-label="`Show ${item.label}`"
              @update:model-value="emit('toggle', item.key, $event === true)"
            />
          </label>
        </div>
      </div>
    </template>
  </UiPopover>
</template>
