<script lang="ts" setup>
import type { ChartAnnotation, ChartAnnotationOptions } from '../../utils/chartAnnotations'
import { computed } from 'vue'
import { UiIcon, UiPopover } from '#components'
import { annotationIconPreview, DEFAULT_ANNOTATION_ICON_LIMIT, resolveAnnotationMarkerGroups } from '../../utils/chartAnnotations'

// Annotation marker overlay: thin vertical lines + interactive dots at specific
// x-positions, for any time-series chart. Extracted from UiChartFrame so charts
// that compose unovis directly (CWV, indexing) get the same markers without
// adopting the whole tooltip/brush frame.
//
// Same-day annotations collapse into ONE marker. Every marker opens the same
// click/keyboard popover, so interactive source and edit actions never depend
// on hover. Up to three item icons preview the stack beside the marker dot;
// remaining items collapse into a +N count.
//
// Positioning: drop this INSIDE the chart's plot wrap (the element whose box is
// `position: relative` and whose width == the plot x-span, i.e. a chart drawn
// with zero horizontal margin). Each marker is `position: absolute` with a CSS
// left-percentage; `width: 0` so it never affects layout, `-translate-x-1/2` to
// centre on the anchor. `bottom-9` (36px) clears a standard x-axis label band.

const { annotations, xDomain, options } = defineProps<{
  /** Event annotations. Empty/undefined renders nothing. */
  annotations?: ChartAnnotation[]
  /** Visible x range [min, max] (Date | ISO string | epoch-ms). Required to position. */
  xDomain?: [Date | string | number, Date | string | number]
  /** Marker presentation. Icon previews are capped at three by type. */
  options?: ChartAnnotationOptions
}>()

const emit = defineEmits<{
  /** Activation of a marker carrying a user-editable annotation. */
  edit: [annotation: ChartAnnotation]
  /** Whether the pointer is currently over a marker trigger. */
  interactionChange: [active: boolean]
}>()

const maxIcons = computed(() => options?.maxIcons ?? DEFAULT_ANNOTATION_ICON_LIMIT)
const markers = computed(() => resolveAnnotationMarkerGroups(annotations, xDomain).map(marker => ({
  ...marker,
  iconPreview: annotationIconPreview(marker.items, maxIcons.value),
})))

function editItem(item: ChartAnnotation, close?: () => void) {
  emit('edit', item)
  close?.()
}

function markerAriaLabel(items: ChartAnnotation[]): string {
  return items.map(item => item.description ? `${item.label}. ${item.description}` : item.label).join('; ')
}

function itemIcon(item: ChartAnnotation): string {
  return item.icon ?? (item.editable ? 'edit' : 'note')
}
</script>

<template>
  <div
    v-for="m in markers"
    :key="m.id"
    class="absolute top-0 bottom-9 z-[5] pointer-events-none w-0"
    :style="{ left: m.leftPct }"
  >
    <!-- Thin 1px vertical marker line centred on the anchor point. -->
    <div class="absolute inset-y-0 w-px -translate-x-1/2 opacity-50" :class="m.toneClass" aria-hidden="true" />
    <UiPopover :content="{ side: 'top', align: 'center' }">
      <button
        type="button"
        data-annotation-marker
        class="group absolute -bottom-4.5 size-11 -translate-x-1/2 pointer-events-auto rounded-full grid place-items-center cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-label="markerAriaLabel(m.items)"
        @pointerenter.stop="emit('interactionChange', true)"
        @pointerleave.stop="emit('interactionChange', false)"
        @pointerdown.stop
        @pointermove.stop
        @mousemove.stop
        @click.stop
      >
        <span
          class="size-1.5 transition-transform duration-100 group-hover:scale-125 group-hover:ring-2 group-hover:ring-primary"
          :class="[m.toneClass, m.editable ? 'rounded-[2px]' : 'rounded-full']"
          aria-hidden="true"
        />
        <span
          v-if="m.iconPreview.visible.length || m.iconPreview.overflowCount"
          data-annotation-icon-preview
          class="absolute left-7 top-1/2 -translate-y-1/2 pointer-events-auto flex items-center -space-x-1 cursor-pointer transition-transform duration-100 group-hover:-translate-y-[55%]"
          aria-hidden="true"
        >
          <span
            v-for="(item, index) in m.iconPreview.visible"
            :key="item.id ?? index"
            data-annotation-icon
            class="size-4 shrink-0 rounded-full bg-default ring-1 ring-default grid place-items-center text-muted transition-colors duration-100 group-hover:ring-primary group-hover:text-default"
          >
            <UiIcon :name="itemIcon(item)" class="size-2.5" />
          </span>
          <span
            v-if="m.iconPreview.overflowCount"
            data-annotation-overflow
            class="h-4 min-w-4 rounded-full bg-default px-1 ring-1 ring-default grid place-items-center font-mono text-[9px] leading-none text-muted transition-colors duration-100 group-hover:ring-primary group-hover:text-default"
          >
            +{{ m.iconPreview.overflowCount }}
          </span>
        </span>
      </button>
      <template #panel="{ close }">
        <div data-annotation-popover-panel class="w-96 max-w-[calc(100vw-2rem)] p-4">
          <p class="pb-3 text-mini font-semibold uppercase tracking-wide text-muted">
            {{ m.count === 1 ? 'Annotation' : `${m.count} annotations` }}
          </p>
          <div class="divide-y divide-default">
            <div
              v-for="(item, i) in m.items"
              :key="item.id ?? i"
              class="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0"
            >
              <span class="mt-0.5 size-5 rounded-full bg-default ring-1 ring-default grid place-items-center text-muted" aria-hidden="true">
                <UiIcon :name="itemIcon(item)" class="size-3" />
              </span>
              <button
                v-if="item.editable"
                type="button"
                class="min-h-11 min-w-0 text-left text-sm font-semibold leading-5 text-default hover:text-primary sm:min-h-0"
                @click="editItem(item, close)"
              >
                {{ item.label }}
              </button>
              <p v-else class="min-w-0 text-sm font-semibold leading-5 text-default">
                {{ item.label }}
              </p>
              <a
                v-if="item.href"
                :href="item.href"
                target="_blank"
                rel="noopener noreferrer"
                class="size-11 -my-3 shrink-0 rounded-md grid place-items-center text-muted hover:text-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:-my-1 sm:size-7"
                :aria-label="`Open source for ${item.label}`"
              >
                <UiIcon name="arrow-up-right" class="size-4" aria-hidden="true" />
              </a>
              <p v-if="item.description" class="col-start-2 col-end-4 text-sm leading-5 text-muted">
                {{ item.description }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </UiPopover>
  </div>
</template>
