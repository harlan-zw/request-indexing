<script setup lang="ts">
import type { VNodeChild } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const { sidebarWidth = 64, contentClass } = defineProps<{
  sidebarWidth?: 56 | 64
  contentClass?: string
}>()

const slots = defineSlots<{
  brand?: () => VNodeChild
  sidebar?: () => VNodeChild
  footer?: () => VNodeChild
  mobileNav?: () => VNodeChild
  default?: () => VNodeChild
  extras?: () => VNodeChild
}>()

const route = useRoute()
const navOpen = ref(false)
const isDesktop = useMediaQuery('(min-width: 1024px)')

watch(() => route.path, () => {
  navOpen.value = false
})

if (import.meta.client) {
  watch(isDesktop, (desktop) => {
    if (desktop)
      navOpen.value = false
  })
}
</script>

<template>
  <div class="flex min-h-dvh bg-default" data-allow-mismatch="children">
    <a
      href="#main-content"
      class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:start-3 focus-visible:top-3 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-default focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:ring-2 focus-visible:ring-primary"
    >Skip to content</a>

    <aside
      class="fixed inset-y-0 start-0 hidden shrink-0 flex-col border-e border-default bg-default lg:flex dark:border-accented dark:bg-muted"
      :class="sidebarWidth === 56 ? 'w-56' : 'w-64'"
    >
      <div v-if="slots.brand" class="shrink-0 px-4 pb-2 pt-4">
        <slot name="brand" />
      </div>
      <div class="scroll-overlay flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-2">
        <slot name="sidebar" />
      </div>
      <div v-if="slots.footer" class="shrink-0 border-t border-default px-3 py-3">
        <slot name="footer" />
      </div>
    </aside>

    <div class="min-w-0 flex-1" :class="sidebarWidth === 56 ? 'lg:ms-56' : 'lg:ms-64'">
      <div class="flex items-center gap-2 border-b border-default px-3 py-2 lg:hidden">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-heroicons-bars-3"
          class="min-h-11 min-w-11 shrink-0"
          aria-label="Open navigation menu"
          @click="navOpen = true"
        />
        <div v-if="slots.mobileNav" class="min-w-0 flex-1">
          <slot name="mobileNav" />
        </div>
      </div>

      <main id="main-content" tabindex="-1" class="min-h-dvh outline-none" :class="contentClass ?? 'p-4 sm:p-6 lg:p-8'">
        <slot />
      </main>
    </div>

    <UDrawer v-model:open="navOpen" direction="left">
      <template #content>
        <div class="flex h-full min-w-0 flex-col overflow-x-hidden bg-default dark:bg-muted">
          <div v-if="slots.brand" class="shrink-0 px-5 pb-2 pt-5">
            <slot name="brand" />
          </div>
          <div class="scroll-overlay flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-2 [&_a]:min-h-11 [&_button]:min-h-11">
            <slot name="sidebar" />
          </div>
          <div v-if="slots.footer" class="shrink-0 border-t border-default px-5 py-4">
            <slot name="footer" />
          </div>
        </div>
      </template>
    </UDrawer>

    <slot name="extras" />
  </div>
</template>
