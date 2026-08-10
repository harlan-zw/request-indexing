<script setup lang="ts">
import type { CompareMode, Period } from '../../composables/useGscPeriod'
import { GSC_STABLE_LATENCY_DAYS, periodToDateRange } from '../../composables/useGscPeriod'
import { COMPARE_OPTIONS, getPeriodLabel, PERIOD_PRESETS } from '../../composables/useProGscFilters'

const period = defineModel<Period>('period', { required: true })
const compareMode = defineModel<CompareMode>('compareMode', { required: true })
const stableData = defineModel<boolean>('stableData', { required: true })

const open = ref(false)

// Countdown to next GSC data update (midnight PST)
const countdown = ref('')

function updateCountdown() {
  const now = new Date()
  const pstNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const msUntilMidnight = (24 * 60 * 60 * 1000)
    - (pstNow.getHours() * 3600000 + pstNow.getMinutes() * 60000 + pstNow.getSeconds() * 1000)
  const totalSeconds = Math.floor(msUntilMidnight / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  countdown.value = `${h}h ${m}m`
}

if (import.meta.client) {
  updateCountdown()
  const { pause } = useIntervalFn(updateCountdown, 60_000)
  onUnmounted(pause)
}

const rollingPresets = PERIOD_PRESETS.filter(p => p.group === 'rolling')
const calendarPresets = PERIOD_PRESETS.filter(p => p.group === 'calendar')

const dateRange = computed(() => periodToDateRange(period.value, stableData.value))
const cmpRange = computed(() => compareRange(dateRange.value, compareMode.value))

const rangeFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const rangeFmtYear = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const numFmt = new Intl.NumberFormat('en-US')

function formatRange(start: string, end: string) {
  const s = new Date(`${start}T00:00:00`)
  const e = new Date(`${end}T00:00:00`)
  if (s.getFullYear() !== e.getFullYear())
    return `${rangeFmtYear.format(s)} – ${rangeFmtYear.format(e)}`
  return `${rangeFmt.format(s)} – ${rangeFmtYear.format(e)}`
}

function selectPeriod(p: Period) {
  period.value = p
  open.value = false
}
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom', sideOffset: 8 }">
    <!-- Trigger -->
    <button
      :aria-label="`Date range: ${getPeriodLabel(period)}`"
      :aria-expanded="open"
      class="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 border focus-visible:ring-2 focus-visible:ring-primary"
      :class="[
        open
          ? 'border-accented bg-elevated text-default'
          : 'border-default bg-muted text-muted hover:text-default hover:border-accented',
      ]"
    >
      <UIcon name="i-lucide-calendar" class="size-3.5" aria-hidden="true" />
      <span>{{ getPeriodLabel(period) }}</span>
      <span
        v-if="compareMode !== 'none'"
        class="text-[11px] px-1.5 py-0.5 rounded-sm font-semibold"
        :class="compareMode === 'year' ? `${periodVizColors.current.bg} ${periodVizColors.current.text}` : `${periodVizColors.comparison.bg} ${periodVizColors.comparison.text}`"
      >
        vs {{ compareMode === 'year' ? 'YoY' : 'prev' }}
      </span>
      <UIcon name="i-lucide-chevron-down" class="size-3 text-dimmed -mr-0.5" aria-hidden="true" />
    </button>

    <!-- Popover content -->
    <template #content>
      <div class="w-[min(440px,calc(100vw-2rem))]">
        <div class="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-default">
          <!-- Left panel: Presets -->
          <div class="sm:w-[190px] py-1.5" role="listbox" :aria-label="`Period presets, current: ${getPeriodLabel(period)}`">
            <div class="px-3 pt-1 pb-2">
              <span class="text-[10px] uppercase tracking-wider font-medium text-dimmed">
                Rolling
              </span>
            </div>
            <div>
              <button
                v-for="preset in rollingPresets"
                :key="preset.value"
                role="option"
                :aria-selected="period === preset.value"
                class="cursor-pointer group w-full flex items-center gap-2 pl-3 pr-3 py-[5px] text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset relative"
                :class="[
                  period === preset.value
                    ? 'text-default bg-elevated'
                    : 'text-muted hover:text-default hover:bg-[var(--ui-bg-elevated)]/50',
                ]"
                @click="selectPeriod(preset.value)"
              >
                <!-- Active indicator bar -->
                <span
                  v-if="period === preset.value"
                  class="absolute left-0 inset-y-0.5 w-[2px] rounded-full bg-primary"
                />
                <span class="flex-1 text-left">{{ preset.label }}</span>
                <UIcon
                  v-if="period === preset.value"
                  name="i-lucide-check"
                  class="size-3 text-primary"
                  aria-hidden="true"
                />
              </button>
            </div>

            <div class="mx-3 my-1.5 border-t border-default/50" role="separator" />

            <div class="px-3 pb-2">
              <span class="text-[10px] uppercase tracking-wider font-medium text-dimmed">
                Calendar
              </span>
            </div>
            <div>
              <button
                v-for="preset in calendarPresets"
                :key="preset.value"
                role="option"
                :aria-selected="period === preset.value"
                class="cursor-pointer group w-full flex items-center gap-2 pl-3 pr-3 py-[5px] text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset relative"
                :class="[
                  period === preset.value
                    ? 'text-default bg-elevated'
                    : 'text-muted hover:text-default hover:bg-[var(--ui-bg-elevated)]/50',
                ]"
                @click="selectPeriod(preset.value)"
              >
                <span
                  v-if="period === preset.value"
                  class="absolute left-0 inset-y-0.5 w-[2px] rounded-full bg-primary"
                />
                <span class="flex-1 text-left">{{ preset.label }}</span>
                <UIcon
                  v-if="period === preset.value"
                  name="i-lucide-check"
                  class="size-3 text-primary"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <!-- Right panel: Context + Comparison -->
          <div class="flex-1 flex flex-col">
            <!-- Date readout -->
            <div class="px-3.5 pt-3 pb-2.5">
              <div class="flex items-baseline gap-2">
                <span class="text-[10px] uppercase tracking-wider font-medium text-dimmed">Range</span>
                <span class="text-[10px] text-dimmed tabular-nums">{{ numFmt.format(dateRange.days) }}d</span>
              </div>
              <p class="text-[13px] font-semibold mt-1 tracking-tight">
                {{ formatRange(dateRange.start, dateRange.end) }}
              </p>
              <!-- Comparison range inline -->
              <p
                v-if="cmpRange"
                class="text-[11px] mt-1 flex items-center gap-1.5"
                :class="compareMode === 'year' ? `${periodVizColors.current.text} opacity-70` : `${periodVizColors.comparison.text} opacity-70`"
              >
                <span class="size-1 rounded-full" :class="compareMode === 'year' ? periodVizColors.current.dot : periodVizColors.comparison.dot" />
                {{ formatRange(cmpRange.start, cmpRange.end) }}
              </p>
            </div>

            <div class="border-t border-default/50" role="separator" />

            <!-- Comparison mode -->
            <div class="px-3.5 py-2.5" role="radiogroup" aria-label="Comparison mode">
              <span class="text-[10px] uppercase tracking-wider font-medium text-dimmed">Compare To</span>
              <div class="mt-1.5 flex flex-col gap-0.5">
                <button
                  v-for="opt in COMPARE_OPTIONS"
                  :key="opt.value"
                  role="radio"
                  :aria-checked="compareMode === opt.value"
                  class="cursor-pointer w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                  :class="[
                    compareMode === opt.value
                      ? 'text-default bg-elevated'
                      : 'text-muted hover:text-default hover:bg-[var(--ui-bg-elevated)]/50',
                  ]"
                  @click="compareMode = opt.value"
                >
                  <span
                    class="size-3 rounded-full border-2 shrink-0 transition-colors"
                    :class="compareMode === opt.value ? 'border-primary bg-primary' : 'border-accented'"
                    aria-hidden="true"
                  />
                  <span class="flex-1 text-left">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <div class="border-t border-default/50" role="separator" />

            <!-- Stable data + next update -->
            <div class="px-3.5 py-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="text-[10px] uppercase tracking-wider font-medium text-dimmed">Stable Data</span>
                  <UiTooltip
                    :title="stableData ? 'Stable Data (On)' : 'Stable Data (Off)'"
                    :description="stableData
                      ? `End date offset by ${GSC_STABLE_LATENCY_DAYS} days. Google takes ~3 days to finalize metrics, this ensures completeness.`
                      : 'Data extends to yesterday. Recent days may show incomplete metrics as Google is still processing.'"
                    side="right"
                    size="md"
                    icon-size="xs"
                  />
                </div>
                <USwitch v-model="stableData" size="xs" />
              </div>
              <ClientOnly>
                <p class="flex items-center gap-1 text-[11px] text-dimmed mt-1.5">
                  <UIcon name="i-lucide-clock" class="size-3" aria-hidden="true" />
                  <span class="tabular-nums">Next update in {{ countdown }}</span>
                  <UiTooltip
                    title="Next Data Update"
                    description="Time until next midnight PST, when Google Search Console publishes new data."
                    side="right"
                    size="md"
                    icon-size="xs"
                  />
                </p>
              </ClientOnly>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
