<script lang="ts" setup>
import type { Period } from '#layers/pro-gsc/shared/public'
import { onKeyStroke } from '@vueuse/core'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion-v'
import { parseCustomPeriod } from '#layers/pro-gsc/shared/public'
import GraphIndexing from './GraphIndexing.vue'

interface DataRow {
  date: string
  indexedPercent: number
  errors: number
  excluded?: number
}

const { loading: loadingProp, ...props } = defineProps<{
  data: DataRow[]
  columns?: ('indexedPercent' | 'errors' | 'excluded')[]
  /** Current period filter (used to detect zoomed state) */
  dateRange?: Period
  /** Chart height (px) */
  height?: number
  loading?: boolean
}>()

const emit = defineEmits<{
  zoom: [range: { start: string, end: string } | null]
}>()

const devSkeleton = useProDevSkeleton()
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})

const hasEverHadData = ref(false)
watch(() => props.data.length, (len) => {
  if (len > 0)
    hasEverHadData.value = true
}, { immediate: true })

// Zoom state (matches ProCardGsc semantics: custom period === zoomed)
const zoomedRange = computed(() => props.dateRange ? parseCustomPeriod(props.dateRange) : null)
const isZoomed = computed(() => zoomedRange.value !== null)

const loading = computed(() => {
  if (!hydrated.value)
    return false
  if (isZoomed.value && hasEverHadData.value && props.data.length > 0)
    return false
  return loadingProp || devSkeleton.value
})

const chartHeight = computed(() => props.height ?? 220)

// --- Tooltip state ---
const tooltipData = ref<DataRow | null>(null)
const isDragging = ref(false)

function onTooltip(data: DataRow | null) {
  if (isDragging.value) {
    tooltipData.value = null
    return
  }
  tooltipData.value = data
}

const TOOLTIP_WIDTH = 200
const EDGE_PAD = 8
const CURSOR_OFFSET = 32

const chartWrapRef = ref<HTMLElement | null>(null)
const cardX = useMotionValue(0)
const pillX = useMotionValue(0)
const cardSpring = useSpring(cardX, { stiffness: 320, damping: 38, mass: 0.6 })
const pillSpring = useSpring(pillX, { stiffness: 700, damping: 45, mass: 0.35 })

function onChartMove(e: MouseEvent) {
  const el = chartWrapRef.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0)
    return
  const cursorX = e.clientX - rect.left
  pillX.set(cursorX)
  let target = cursorX + CURSOR_OFFSET
  if (target + TOOLTIP_WIDTH > rect.width - EDGE_PAD)
    target = cursorX - TOOLTIP_WIDTH - CURSOR_OFFSET
  target = Math.max(EDGE_PAD, Math.min(rect.width - TOOLTIP_WIDTH - EDGE_PAD, target))
  cardX.set(target)
}

const hoverDateShort = computed(() => {
  if (!tooltipData.value?.date)
    return ''
  return new Date(tooltipData.value.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })
})

const hoverDateFull = computed(() => {
  if (!tooltipData.value?.date)
    return ''
  return new Date(tooltipData.value.date).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
})

// --- Brush / zoom selection ---
interface BrushRange {
  startIdx: number
  endIdx: number
  startDate: string
  endDate: string
}

const dragRange = ref<BrushRange | null>(null)

function idxToPixel(idx: number): number {
  const el = chartWrapRef.value
  const len = props.data?.length ?? 0
  if (!el || len < 2)
    return 0
  return (idx / (len - 1)) * el.getBoundingClientRect().width
}

const selectionLeft = computed(() => dragRange.value ? idxToPixel(dragRange.value.startIdx) : 0)
const selectionWidth = computed(() => dragRange.value
  ? Math.max(0, idxToPixel(dragRange.value.endIdx) - idxToPixel(dragRange.value.startIdx))
  : 0,
)

function formatDragDate(iso: string): string {
  if (!iso)
    return ''
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const dragStartLabel = computed(() => formatDragDate(dragRange.value?.startDate ?? ''))
const dragEndLabel = computed(() => formatDragDate(dragRange.value?.endDate ?? ''))
const dragDurationLabel = computed(() => {
  const r = dragRange.value
  if (!r)
    return ''
  const days = r.endIdx - r.startIdx + 1
  return `${days} day${days === 1 ? '' : 's'}`
})

const DRAG_THRESHOLD_PX = 5

function pixelToIdx(px: number): number {
  const el = chartWrapRef.value
  const len = props.data?.length ?? 0
  if (!el || len < 2)
    return 0
  const width = el.getBoundingClientRect().width
  if (width <= 0)
    return 0
  return Math.max(0, Math.min(len - 1, Math.round((px / width) * (len - 1))))
}

function idxToDate(idx: number): string {
  const rows = props.data ?? []
  const clamped = Math.max(0, Math.min(rows.length - 1, idx))
  return rows[clamped]?.date ?? ''
}

let dragStartX = 0
let dragStartIdx = 0
let removeWindowListeners: (() => void) | null = null

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0)
    return
  const el = chartWrapRef.value
  if (!el)
    return
  const rect = el.getBoundingClientRect()
  dragStartX = e.clientX - rect.left
  dragStartIdx = pixelToIdx(dragStartX)

  const onMove = (ev: PointerEvent) => {
    const currentX = ev.clientX - rect.left
    if (!isDragging.value) {
      if (Math.abs(currentX - dragStartX) < DRAG_THRESHOLD_PX)
        return
      isDragging.value = true
      tooltipData.value = null
    }
    const currentIdx = pixelToIdx(currentX)
    const startIdx = Math.min(dragStartIdx, currentIdx)
    const endIdx = Math.max(dragStartIdx, currentIdx)
    dragRange.value = {
      startIdx,
      endIdx,
      startDate: idxToDate(startIdx),
      endDate: idxToDate(endIdx),
    }
  }

  const onUp = () => {
    removeWindowListeners?.()
    removeWindowListeners = null
    const range = dragRange.value
    isDragging.value = false
    dragRange.value = null
    if (range && range.endIdx > range.startIdx) {
      emit('zoom', { start: range.startDate, end: range.endDate })
    }
  }

  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
  window.addEventListener('pointercancel', onUp, { once: true })
  removeWindowListeners = () => {
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
}

function resetZoom() {
  emit('zoom', null)
}

onKeyStroke('Escape', () => {
  if (isDragging.value || dragRange.value) {
    isDragging.value = false
    dragRange.value = null
    return
  }
  if (isZoomed.value)
    resetZoom()
})

const zoomRangeLabel = computed(() => {
  const r = zoomedRange.value
  if (!r)
    return ''
  const fmt = (d: string) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  return `${fmt(r.start)} → ${fmt(r.end)}`
})

// --- Tooltip metric rows (indexed / not-indexed / errors) ---
const tooltipRows = computed(() => {
  const d = tooltipData.value
  if (!d)
    return []
  const notIndexed = Math.max(0, 100 - d.indexedPercent)
  return [
    { key: 'indexed', label: 'Indexed', dot: indexingVizColors.indexed.dot, value: `${d.indexedPercent.toFixed(1)}%` },
    { key: 'notIndexed', label: 'Not indexed', dot: indexingVizColors.notIndexed.dot, value: `${notIndexed.toFixed(1)}%` },
    ...(props.columns?.includes('errors')
      ? [{ key: 'errors', label: 'Errors', dot: indexingVizColors.errors.dot, value: formatNumber(d.errors) }]
      : []),
  ]
})
</script>

<template>
  <div data-testid="indexing-card" class="flex flex-col">
    <!-- Chart area -->
    <div
      ref="chartWrapRef"
      class="relative select-none touch-none"
      :class="{ 'cursor-crosshair': !isDragging, 'cursor-ew-resize': isDragging }"
      @mousemove="onChartMove"
      @pointerdown="onPointerDown"
    >
      <AnimatePresence>
        <!-- Hover tooltip card -->
        <motion.div
          v-if="tooltipData"
          key="idx-tooltip-card"
          :initial="{ opacity: 0, y: -4, filter: 'blur(6px)', scale: 0.97 }"
          :animate="{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }"
          :exit="{ opacity: 0, y: -4, filter: 'blur(6px)', scale: 0.98 }"
          :transition="{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }"
          :style="{ x: cardSpring, width: `${TOOLTIP_WIDTH}px` }"
          class="absolute top-1 left-0 z-10 rounded-lg border border-default bg-elevated backdrop-blur-md overflow-hidden pointer-events-none"
        >
          <div class="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-default bg-muted">
            <span class="text-[11px] font-semibold text-default font-mono tabular-nums">{{ hoverDateFull }}</span>
          </div>
          <div class="flex flex-col gap-px px-2.5 py-2">
            <div
              v-for="row in tooltipRows"
              :key="row.key"
              class="grid grid-cols-[auto_1fr_auto] items-center gap-2 py-0.5"
            >
              <span class="size-1.5 rounded-full" :class="row.dot" />
              <span class="text-[11px] text-muted">{{ row.label }}</span>
              <span class="text-[13px] font-semibold text-default font-mono tabular-nums justify-self-end">{{ row.value }}</span>
            </div>
          </div>
        </motion.div>

        <!-- Floating date pill at cursor x -->
        <motion.div
          v-if="tooltipData"
          key="idx-tooltip-pill"
          :initial="{ opacity: 0, y: 4, scale: 0.9 }"
          :animate="{ opacity: 1, y: 0, scale: 1 }"
          :exit="{ opacity: 0, y: 4, scale: 0.9 }"
          :transition="{ duration: 0.15, ease: 'easeOut' }"
          :style="{ x: pillSpring }"
          class="absolute bottom-9 left-0 z-10 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-inverted text-inverted text-[10px] font-medium font-mono tabular-nums whitespace-nowrap pointer-events-none"
        >
          {{ hoverDateShort }}
        </motion.div>

        <!-- Drag-to-zoom selection rect -->
        <motion.div
          v-if="dragRange"
          key="idx-drag-rect"
          :initial="{ opacity: 0 }"
          :animate="{ opacity: 1 }"
          :exit="{ opacity: 0 }"
          :transition="{ duration: 0.12, ease: 'easeOut' }"
          :style="{ left: `${selectionLeft}px`, width: `${selectionWidth}px`, bottom: '36px' }"
          class="absolute top-0 z-10 pointer-events-none bg-primary/10 border-x border-dashed border-primary/50"
        />

        <motion.div
          v-if="dragRange"
          key="idx-drag-start-pill"
          :initial="{ opacity: 0, y: 4 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 4 }"
          :transition="{ duration: 0.15, ease: 'easeOut' }"
          :style="{ left: `${selectionLeft}px` }"
          class="absolute bottom-9 z-10 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-inverted text-inverted text-[10px] font-medium font-mono tabular-nums whitespace-nowrap pointer-events-none"
        >
          {{ dragStartLabel }}
        </motion.div>
        <motion.div
          v-if="dragRange"
          key="idx-drag-end-pill"
          :initial="{ opacity: 0, y: 4 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 4 }"
          :transition="{ duration: 0.15, ease: 'easeOut' }"
          :style="{ left: `${selectionLeft + selectionWidth}px` }"
          class="absolute bottom-9 z-10 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-inverted text-inverted text-[10px] font-medium font-mono tabular-nums whitespace-nowrap pointer-events-none"
        >
          {{ dragEndLabel }}
        </motion.div>

        <motion.div
          v-if="dragRange && selectionWidth > 56"
          key="idx-drag-duration"
          :initial="{ opacity: 0, scale: 0.9 }"
          :animate="{ opacity: 1, scale: 1 }"
          :exit="{ opacity: 0, scale: 0.9 }"
          :transition="{ duration: 0.15, ease: 'easeOut' }"
          :style="{ left: `${selectionLeft + selectionWidth / 2}px` }"
          class="absolute top-2 z-10 -translate-x-1/2 px-2 py-0.5 rounded-full bg-primary text-inverted text-[10px] font-semibold uppercase whitespace-nowrap pointer-events-none"
        >
          {{ dragDurationLabel }}
        </motion.div>
      </AnimatePresence>

      <ClientOnly>
        <GraphIndexing
          :data="data"
          :columns="columns"
          :height="chartHeight"
          :loading="loading"
          @tooltip="onTooltip"
        />

        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 translate-y-1"
        >
          <button
            v-if="isZoomed && !isDragging"
            type="button"
            class="absolute top-1 right-1 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-elevated backdrop-blur-sm border border-default hover:bg-accented transition-colors text-[11px] text-default"
            @click="resetZoom"
          >
            <UIcon name="i-lucide-x" class="size-3" />
            <span class="font-mono tabular-nums">{{ zoomRangeLabel }}</span>
          </button>
        </Transition>

        <template #fallback>
          <div class="flex items-end gap-1 h-[220px] px-4 pb-4">
            <UiSkeleton v-for="i in 12" :key="i" type="bar" :index="i" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>
