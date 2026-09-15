<script setup lang="ts">
import type { UiToastProps } from './UiToast.vue'
import { useMounted, useRafFn } from '@vueuse/core'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from '#imports'
import { springs } from '../../shared/motion'
import UiToast from './UiToast.vue'

// Sonner/Linear-style toaster. Resting state is a COLLAPSED peek-deck: only the
// newest card is fully readable, the rest scale down + peek a few px behind it.
// Hovering the deck fans it into a readable list and pauses every timer. motion-v
// drives the per-depth transforms (enter / make-room / exit / fan) off reactive
// targets, so adding/removing a toast re-stacks the deck automatically. We reuse
// Nuxt UI's shared useToast() queue, so every existing `toast.add(...)` keeps
// working unchanged. (Interaction model: brand-kit /toasts → "Fire 5 at once".)

export interface UiToasterProps {
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  /** Max cards rendered in the deck (older ones collapse into a "+N" pill). */
  max?: number
  /** Default auto-dismiss in ms; a per-toast `duration` overrides. 0 = sticky. */
  duration?: number
  /** Passed to every card: adds "Report bug" to failure toasts. See UiToast. */
  reportBug?: UiToastProps['reportBug']
}

const {
  position = 'bottom-right',
  max = 3,
  duration = 5000,
  reportBug,
} = defineProps<UiToasterProps>()

const { toasts, remove } = useToast()
const mounted = useMounted()
const reduced = useReducedMotion()

// Deck geometry.
const PEEK = 14 // px each back card peeks above the front
const SCALE_STEP = 0.05 // scale shrink per depth
const GAP = 14 // px gap between cards when fanned
const FALLBACK_H = 72 // height used before a card has been measured

const isTop = computed(() => position.startsWith('top'))
const expanded = ref(false)

// Newest last in the queue; cap to `max` (keep the most recent). Within
// `visible`, index 0 = oldest, last = newest = deck front (depth 0).
const visible = computed(() => toasts.value.slice(-max))
const overflow = computed(() => Math.max(0, toasts.value.length - visible.value.length))

// Per-id measured natural heights, reported by each UiToast.
const heights = reactive<Record<string, number>>({})
function setHeight(id: string | number, h: number) {
  heights[String(id)] = h
}
function heightOf(id: string | number | undefined): number {
  return (id != null && heights[String(id)]) || FALLBACK_H
}

// Placement (transform target + chrome flags) per visible toast. motion-v tweens
// between successive targets, so a queue change animates the whole deck.
const placements = computed(() => {
  const list = visible.value
  const n = list.length
  // depth 0 = front (newest = last). heightAtDepth indexes by depth.
  const heightAtDepth = (depth: number) => heightOf(list[n - 1 - depth]?.id)

  // Cumulative bottom offsets for the fanned (expanded) state.
  const expandedOffset: number[] = []
  let acc = 0
  for (let d = 0; d < n; d++) {
    expandedOffset[d] = acc
    acc += heightAtDepth(d) + GAP
  }
  const frontH = heightAtDepth(0)
  const dir = isTop.value ? 1 : -1 // grow downward for top-anchored, upward otherwise

  return list.map((t, idx) => {
    const depth = n - 1 - idx
    const ownH = heightOf(t.id)
    if (expanded.value) {
      return {
        depth,
        peek: false,
        z: 100 - depth,
        target: {
          y: dir * expandedOffset[depth]!,
          scale: 1,
          opacity: 1,
          height: ownH,
        },
      }
    }
    return {
      depth,
      peek: depth > 0,
      z: 100 - depth,
      target: {
        y: dir * depth * PEEK,
        scale: Number((1 - depth * SCALE_STEP).toFixed(3)),
        opacity: depth < max ? 1 : 0,
        height: depth > 0 ? frontH : ownH,
      },
    }
  })
})

// Region height — sized so the whole deck/fan is one continuous hover zone
// (prevents fan-out flicker as cards reposition out from under the pointer).
const regionHeight = computed(() => {
  const n = visible.value.length
  if (!n)
    return 0
  if (expanded.value) {
    return visible.value.reduce((sum, t) => sum + heightOf(t.id) + GAP, 0)
  }
  const front = heightOf(visible.value[n - 1]!.id)
  return front + (Math.min(n, max) - 1) * PEEK
})

// ── Timers — one rAF loop, pauses entirely while the deck is fanned/hovered ──
const elapsed = reactive<Record<string, number>>({})
const progress = reactive<Record<string, number>>({})
const dragging = reactive<Record<string, boolean>>({})

function durationOf(t: (typeof toasts.value)[number]): number {
  const d = (t as { duration?: number }).duration
  return typeof d === 'number' ? d : duration
}

useRafFn(({ delta }) => {
  if (expanded.value)
    return // fanned → all timers paused
  // Only the front (primary) toast counts down. Buried cards hold their full
  // duration and start their own timer once promoted to the front — so a toast
  // never expires while hidden behind the deck (timers stack, they don't race).
  const list = visible.value
  const front = list.at(-1)
  if (!front)
    return
  const id = String(front.id)
  const total = durationOf(front)
  if (!total || total <= 0 || dragging[id])
    return
  elapsed[id] = (elapsed[id] || 0) + delta
  progress[id] = Math.max(0, 1 - elapsed[id]! / total)
  if (elapsed[id]! >= total)
    remove(front.id)
})

// Prune timer bookkeeping for toasts that have left the queue.
watch(visible, (list) => {
  const live = new Set(list.map(t => String(t.id)))
  for (const id of Object.keys(elapsed)) {
    if (!live.has(id)) {
      delete elapsed[id]
      delete progress[id]
      delete dragging[id]
      delete heights[id]
    }
  }
})

function progressFor(t: (typeof toasts.value)[number]): number | false {
  return durationOf(t) > 0 ? (progress[String(t.id)] ?? 1) : false
}

// ── Drag to dismiss ──
function canDrag(depth: number): boolean {
  return expanded.value || depth === 0
}
function onDragStart(id: string | number) {
  dragging[String(id)] = true
}
function onDragEnd(id: string | number, info: { offset: { x: number }, velocity: { x: number } }) {
  dragging[String(id)] = false
  if (info.offset.x > 100 || info.velocity.x > 600)
    remove(id)
}

// Whitelist the fields UiToast consumes so queue bookkeeping never hits the DOM.
function toastBind(t: (typeof toasts.value)[number]): Partial<UiToastProps> {
  const x = t as unknown as Record<string, unknown>
  return {
    title: x.title as UiToastProps['title'],
    description: x.description as UiToastProps['description'],
    icon: x.icon as UiToastProps['icon'],
    color: x.color as UiToastProps['color'],
    status: x.status as UiToastProps['status'],
    actions: x.actions as UiToastProps['actions'],
    close: x.close as UiToastProps['close'],
  }
}

const stackTransition = computed(() =>
  reduced.value
    ? { duration: 0 }
    : { default: springs.snappy, opacity: { duration: 0.25 }, height: springs.smooth },
)

const posClass = computed(() => ({
  'top-left': 'top-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
}[position]))
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <!-- Region wrapper owns the hover zone + landmark role; keeping `role` off the
         <ol> preserves its list semantics so the <li> aren't orphaned (a11y). -->
    <div
      class="pointer-events-auto fixed z-[100] w-[calc(100vw-2rem)] sm:w-96"
      :class="posClass"
      :style="{ height: `${regionHeight}px` }"
      role="region"
      aria-label="Notifications"
      @mouseenter="expanded = true"
      @mouseleave="expanded = false"
      @focusin="expanded = true"
      @focusout="(e: FocusEvent) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) expanded = false }"
    >
      <ol class="absolute inset-0 m-0 list-none p-0" aria-live="polite">
        <AnimatePresence :initial="false">
          <motion.li
            v-for="(t, idx) in visible"
            :key="t.id"
            class="absolute inset-x-0 overflow-hidden"
            :class="isTop ? 'top-0' : 'bottom-0'"
            style="transform-origin: bottom center; will-change: transform;"
            :style="{ zIndex: placements[idx]!.z }"
            :initial="reduced ? false : { opacity: 0, y: isTop ? -40 : 40, scale: 0.9, height: placements[idx]!.target.height }"
            :animate="placements[idx]!.target"
            :exit="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }"
            :transition="stackTransition"
            :drag="canDrag(placements[idx]!.depth) ? 'x' : false"
            :drag-snap-to-origin="true"
            :drag-elastic="{ left: 0.15, right: 0.6 }"
            :drag-constraints="{ left: 0, right: 0 }"
            @drag-start="onDragStart(t.id)"
            @drag-end="(_e: PointerEvent, info: { offset: { x: number }, velocity: { x: number } }) => onDragEnd(t.id, info)"
          >
            <UiToast
              v-bind="toastBind(t)"
              :report-bug="reportBug"
              :peek="placements[idx]!.peek"
              :progress="progressFor(t)"
              @measure="(h: number) => setHeight(t.id, h)"
              @close="remove(t.id)"
            />
          </motion.li>
        </AnimatePresence>
      </ol>

      <!-- "+N more" pill — sibling of the <ol> (never inside it). Sits just clear
           of the deck: above it for bottom-anchored, below it for top-anchored. -->
      <div
        v-if="overflow > 0 && !expanded"
        class="pointer-events-none absolute right-2 text-mini font-medium text-dimmed"
        :class="isTop ? 'bottom-0 translate-y-full pt-1' : 'top-0 -translate-y-full pb-1'"
      >
        +{{ overflow }} more
      </div>
    </div>
  </Teleport>
</template>
