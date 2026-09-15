<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatTimeAgo } from '../../composables/formatting'

// Hydration-safe relative time. A bare relative string (e.g. "5m ago") is
// derived from Date.now(), so it differs between the server render and client
// hydration and trips a mismatch. This renders the *absolute* date during SSR
// and the first client paint (identical on both), then swaps to the live
// relative string after mount. The absolute date is always available in `title`.
const { date, fallback = '—', format = 'narrow' } = defineProps<{
  /** Unix seconds (number), an ISO/date string, or a Date. */
  date: number | string | Date | null | undefined
  /** Shown when `date` is null/invalid. */
  fallback?: string
  /** `narrow` ("in 3d") for dense cells; `long` ("in 3 days") where the value stands alone. */
  format?: 'narrow' | 'long'
}>()

// The server's locale/timezone and the browser's can differ. Use one explicit
// formatter through hydration, then switch the title to the viewer's local
// formatting after mount alongside the relative display text.
const hydrationAbsoluteFormat = new Intl.DateTimeFormat('en-AU', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})
const localAbsoluteFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

const parsed = computed(() => {
  if (date == null)
    return null
  const d = typeof date === 'number' ? new Date(date * 1000) : new Date(date)
  return Number.isNaN(d.getTime()) ? null : d
})

const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const absolute = computed(() => {
  if (!parsed.value)
    return ''
  return (mounted.value ? localAbsoluteFormat : hydrationAbsoluteFormat).format(parsed.value)
})
const display = computed(() => {
  if (!parsed.value)
    return fallback
  // `formatTimeAgo` (and thus Date.now()) is only read after mount — never on
  // the server — so SSR and first-paint HTML stay identical.
  return mounted.value ? (formatTimeAgo(date, format) ?? absolute.value) : absolute.value
})
</script>

<template>
  <time v-if="parsed" :datetime="parsed.toISOString()" :title="absolute">{{ display }}</time>
  <span v-else>{{ fallback }}</span>
</template>
