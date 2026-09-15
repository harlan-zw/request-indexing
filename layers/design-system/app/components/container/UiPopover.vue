<script setup lang="ts">
import type { PopoverProps } from '@nuxt/ui'
import type { VNode } from 'vue'
import { computed, useSlots, watch } from 'vue'
import { UPopover } from '#components'

type UiPopoverProps = Omit<PopoverProps, 'open' | 'defaultOpen' | 'portal' | 'ui'> & {
  /** Prevent opening while retaining the trigger in the page flow. */
  disabled?: boolean
  /** The content remains portalled; callers may target a specific portal host. */
  portal?: true | string | HTMLElement
  /** Optional semantic role applied to the owned panel wrapper. */
  role?: string
  /** Stable id for associating the panel with its trigger. */
  panelId?: string
  ui?: PopoverProps['ui']
}

const props = withDefaults(defineProps<UiPopoverProps>(), {
  dismissible: true,
  portal: true,
})
const emit = defineEmits<{
  'close:prevent': []
}>()
defineSlots<{
  default?: (props: { disabled: boolean, open: boolean }) => VNode[]
  panel?: (props: { close?: () => void }) => VNode[]
  anchor?: (props: { close?: () => void }) => VNode[]
}>()

const slots = useSlots()
const open = defineModel<boolean>('open', { default: false })
const guardedOpen = computed({
  get: () => props.disabled ? false : open.value,
  set: (nextOpen: boolean) => {
    if (props.disabled && nextOpen)
      return
    open.value = nextOpen
  },
})

watch(() => props.disabled, (disabled) => {
  if (disabled)
    open.value = false
})

// Keep the application popover contract resilient by default. UPopover remains
// the accessible implementation detail; callers cannot disable its portal and
// every panel gets collision padding plus the shared overlay chrome.
const forwardedProps = computed(() => {
  const { disabled: _disabled, panelId: _panelId, role: _role, ui: _ui, ...forwarded } = props
  return {
    ...forwarded,
    mode: props.mode ?? 'click',
    openDelay: props.openDelay ?? 0,
    closeDelay: props.closeDelay ?? 0,
    dismissible: props.dismissible ?? true,
    portal: props.portal ?? true,
    content: {
      side: 'bottom' as const,
      sideOffset: 8,
      collisionPadding: 8,
      ...props.content,
    },
  }
})

const mergedUi = computed<PopoverProps['ui']>(() => {
  const userContent = props.ui?.content
  return {
    ...props.ui,
    content: typeof userContent === 'function'
      ? (defaults: string) => ['ui-popover-content', userContent(defaults)]
      : ['ui-popover-content', userContent],
  }
})
</script>

<template>
  <UPopover
    v-bind="forwardedProps"
    v-model:open="guardedOpen"
    :ui="mergedUi"
    @close:prevent="emit('close:prevent')"
  >
    <template v-if="slots.default" #default="slotProps">
      <slot v-bind="slotProps" :disabled="props.disabled ?? false" />
    </template>

    <template v-if="slots.anchor" #anchor="slotProps">
      <slot name="anchor" v-bind="slotProps" />
    </template>

    <template #content="slotProps">
      <div v-if="props.role || props.panelId" :id="props.panelId" data-ui="UiPopover" :role="props.role">
        <slot name="panel" v-bind="slotProps" />
      </div>
      <slot v-else name="panel" v-bind="slotProps" />
    </template>
  </UPopover>
</template>
