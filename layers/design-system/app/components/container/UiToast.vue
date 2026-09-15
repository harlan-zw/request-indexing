<script setup lang="ts">
import type { Component } from 'vue'
import type { SemanticStatus } from '../../composables/semanticColors'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef, watch } from 'vue'
import { UiButton, UiIcon } from '#components'
import { semanticColors } from '../../composables/semanticColors'

// A single toast card. Pure presentation: owns our chrome (neutral surface;
// semantic accent rides the icon + 1px top bar + corner bloom only, per the
// color-budget rule — mirrors UiAlert) plus the auto-dismiss progress bar.
// All positioning / stacking / motion / timers / drag live in UiToaster, which
// renders this inside a `<motion.li>`. Rendered exclusively from the shared
// useToast() queue, so every existing `toast.add(...)` call site keeps working.

export interface ToastAction {
  label: string
  icon?: string
  to?: string
  onClick?: (e: MouseEvent) => void
  /** Visual emphasis. `primary` = filled, `neutral` = quiet. */
  color?: 'primary' | 'neutral'
}

export interface UiToastProps {
  /** Heading text (string or a render component). */
  title?: string | Component
  /** Body text (string or a render component). */
  description?: string | Component
  /** Semantic status — drives accent + default icon. Wins over `color`. */
  status?: SemanticStatus
  /** Nuxt UI color compatibility for existing `toast.add({ color })` call sites. */
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  /** Icon override. Defaults to the status icon. */
  icon?: string
  /** Inline action buttons. */
  actions?: ToastAction[]
  /**
   * Bug-report handler. When set, failure toasts (error/warning) that carry no
   * action of their own get a "Report bug" button. Wired by the app (the
   * design system must not reach for the feedback drawer itself).
   */
  reportBug?: (toast: { title?: string, description?: string }) => void
  /** Show the close button. */
  close?: boolean
  /** Auto-dismiss progress 0..1 (remaining), or false to hide the bar. */
  progress?: number | false
  /** Collapsed back card — fade content so the deck reads as peeking cards. */
  peek?: boolean
}

const {
  title,
  description,
  status,
  color,
  icon,
  actions,
  reportBug,
  close = true,
  progress = false,
  peek = false,
} = defineProps<UiToastProps>()

const emit = defineEmits<{
  close: []
  /** Reports the card's natural height to the toaster for fan-out offsets. */
  measure: [number]
}>()

// Map legacy Nuxt UI `color` to our semantic vocabulary. `status` wins if set.
const COLOR_TO_STATUS: Record<NonNullable<UiToastProps['color']>, SemanticStatus> = {
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
  neutral: 'neutral',
  primary: 'info',
  secondary: 'neutral',
}

const defaultIcons: Record<SemanticStatus, string> = {
  error: 'caution',
  warning: 'warning',
  info: 'note',
  success: 'success',
  neutral: 'circle-dash',
}

const resolvedStatus = computed<SemanticStatus>(() => status ?? (color ? COLOR_TO_STATUS[color] : 'neutral'))
const colors = computed(() => semanticColors[resolvedStatus.value])
const resolvedIcon = computed(() => icon || defaultIcons[resolvedStatus.value])

// Anything the user sees fail should be one click from a bug report, same as
// the page-level error boundary. A toast that already carries its own action
// (Upgrade, Retry) keeps it — one CTA per toast, per the color/action budget.
const resolvedActions = computed<ToastAction[]>(() => {
  if (actions?.length)
    return actions
  if (!reportBug || (resolvedStatus.value !== 'error' && resolvedStatus.value !== 'warning'))
    return []
  return [{
    label: 'Report bug',
    icon: 'bug',
    color: 'neutral',
    onClick: () => reportBug({
      title: typeof title === 'string' ? title : undefined,
      description: typeof description === 'string' ? description : undefined,
    }),
  }]
})

// Measure natural height reactively (ResizeObserver) so the toaster's fan-out
// offsets stay correct even after fonts load / content reflows. A one-shot
// onMounted getBoundingClientRect reads 0 inside the portal and collapses the
// fan — useElementSize avoids that.
const root = useTemplateRef<HTMLElement>('root')
const { height } = useElementSize(root)
watch(height, (h) => {
  if (h)
    emit('measure', h)
}, { immediate: true })

function onAction(action: ToastAction, e: MouseEvent) {
  e.stopPropagation()
  action.onClick?.(e)
}
</script>

<template>
  <div
    ref="root"
    class="group relative w-full overflow-hidden rounded-xl border border-default bg-default/90 ring-1 ring-black/5 backdrop-blur-md dark:ring-white/5"
    style="box-shadow: var(--elevation-overlay)"
  >
    <!-- Gradient accent bar — top edge, crisp at left, fades right (mirrors UiAlert). -->
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-px opacity-40"
      :class="colors.dot"
      style="mask-image: linear-gradient(to right, black 0%, black 20%, transparent 80%); -webkit-mask-image: linear-gradient(to right, black 0%, black 20%, transparent 80%);"
      aria-hidden="true"
    />
    <!-- Corner bloom — faint radial light source. -->
    <div
      class="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-10 blur-2xl"
      :class="colors.dot"
      aria-hidden="true"
    />

    <!-- Content — fades out on collapsed back cards so the deck reads as a tidy stack. -->
    <div
      class="flex items-start gap-3 p-3.5 pr-9 transition-opacity duration-200"
      :class="peek ? 'opacity-0' : 'opacity-100'"
    >
      <UiIcon
        v-if="resolvedIcon"
        :name="resolvedIcon"
        class="mt-0.5 size-4 shrink-0"
        :class="colors.text"
        aria-hidden="true"
      />

      <div class="min-w-0 flex-1">
        <p
          v-if="title"
          class="text-sm font-medium leading-snug text-default"
        >
          <component :is="title" v-if="typeof title === 'object'" />
          <template v-else>
            {{ title }}
          </template>
        </p>
        <div
          v-if="description"
          class="text-xs leading-snug text-muted"
          :class="{ 'mt-0.5': title }"
        >
          <component :is="description" v-if="typeof description === 'object'" />
          <template v-else>
            {{ description }}
          </template>
        </div>

        <div
          v-if="resolvedActions.length"
          class="mt-2.5 flex flex-wrap gap-2"
        >
          <UiButton
            v-for="(action, index) in resolvedActions"
            :key="index"
            size="xs"
            :purpose="action.color === 'primary' ? 'cta' : 'secondary'"
            :icon="action.icon"
            :label="action.label"
            :to="action.to"
            class="min-h-11 sm:min-h-0"
            @pointerdown.stop
            @click="onAction(action, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Dismiss — a plain control (not the motion UiButton, whose width-measure +
         overflow clip mis-render a tiny absolute icon). 24px hit target, icon
         centered; subtle at rest and strengthens on hover/focus so it's always
         discoverable. `pointerdown.stop` so it never starts a card drag;
         `click.stop` so it never triggers the card's onClick. -->
    <button
      v-if="close && !peek"
      type="button"
      class="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md text-dimmed opacity-60 transition hover:bg-elevated hover:text-default hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-border-accented)]"
      aria-label="Dismiss"
      @pointerdown.stop
      @click.stop="emit('close')"
    >
      <UiIcon name="close" class="size-3.5" aria-hidden="true" />
    </button>

    <!-- Auto-dismiss progress — width = remaining fraction; hidden on back cards. -->
    <div
      v-if="progress !== false && !peek"
      class="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-50"
      :class="colors.dot"
      :style="{ width: `${Math.max(0, Math.min(1, progress)) * 100}%` }"
      aria-hidden="true"
    />
  </div>
</template>
