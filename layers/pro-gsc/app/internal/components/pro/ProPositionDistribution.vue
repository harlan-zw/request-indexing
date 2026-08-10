<script lang="ts" setup>
import { CurveType } from '@unovis/ts'
import { VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'

interface DataPoint {
  date: string
  pos_1_3: number
  pos_4_10: number
  pos_11_20: number
  pos_20_plus: number
  total: number
}

const { data, height = 180, loading: loadingProp } = defineProps<{
  data: DataPoint[]
  height?: number
  loading?: boolean
}>()

const devSkeleton = useProDevSkeleton()
const loading = computed(() => loadingProp || devSkeleton.value)

const colors = {
  top3: positionDistColors.top3.hex,
  page1: positionDistColors.page1.hex,
  page2: positionDistColors.page2.hex,
  deep: positionDistColors.deep.hex,
}

const x = (_: DataPoint, i: number) => i
const pos1_3 = (d: DataPoint) => d.pos_1_3 ?? 0
const pos4_10 = (d: DataPoint) => d.pos_4_10 ?? 0
const pos11_20 = (d: DataPoint) => d.pos_11_20 ?? 0
const pos20plus = (d: DataPoint) => d.pos_20_plus ?? 0

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function tickFormat(i: number) {
  const d = data[i]?.date
  if (!d)
    return ''
  return dateFormatter.format(new Date(`${d}T00:00:00`))
}

function yFormat(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(Math.round(n))
}

function template(d: DataPoint) {
  const date = dateFormatter.format(new Date(`${d.date}T00:00:00`))
  return `
  <div class="text-[13px] space-y-0.5 tabular-nums">
    <div class="font-medium text-default mb-1">${date}</div>
    <div class="flex items-center gap-2">
      <span class="size-1.5 rounded-full shrink-0" style="background:${colors.top3}"></span>
      <span class="text-muted">1-3</span>
      <span class="ml-auto">${formatNumber(d.pos_1_3 ?? 0)}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="size-1.5 rounded-full shrink-0" style="background:${colors.page1}"></span>
      <span class="text-muted">4-10</span>
      <span class="ml-auto">${formatNumber(d.pos_4_10 ?? 0)}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="size-1.5 rounded-full shrink-0" style="background:${colors.page2}"></span>
      <span class="text-muted">11-20</span>
      <span class="ml-auto">${formatNumber(d.pos_11_20 ?? 0)}</span>
    </div>
    <div class="flex items-center gap-2">
      <span class="size-1.5 rounded-full shrink-0" style="background:${colors.deep}"></span>
      <span class="text-muted">20+</span>
      <span class="ml-auto">${formatNumber(d.pos_20_plus ?? 0)}</span>
    </div>
    <div class="border-t border-default pt-0.5 mt-1 text-dimmed">Total: ${formatNumber(d.total ?? 0)}</div>
  </div>
`
}
</script>

<template>
  <div>
    <UiSkeleton v-if="loading" :lines="3" :base="180" :range="80" />
    <template v-else-if="data?.length">
      <ClientOnly>
        <VisXYContainer :data="data" :height="height">
          <VisLine :x="x" :y="pos1_3" :color="colors.top3" :line-width="2" :curve-type="CurveType.MonotoneX" />
          <VisLine :x="x" :y="pos4_10" :color="colors.page1" :line-width="2" :curve-type="CurveType.MonotoneX" />
          <VisLine :x="x" :y="pos11_20" :color="colors.page2" :line-width="2" :curve-type="CurveType.MonotoneX" />
          <VisLine :x="x" :y="pos20plus" :color="colors.deep" :line-width="2" :curve-type="CurveType.MonotoneX" />
          <VisAxis type="x" :tick-format="tickFormat" :num-ticks="7" />
          <VisAxis type="y" :tick-format="yFormat" />
          <VisCrosshair :template="template" />
          <VisTooltip />
        </VisXYContainer>
        <template #fallback>
          <UiSkeleton :lines="3" :base="180" :range="80" />
        </template>
      </ClientOnly>
    </template>
    <div v-else class="flex items-center justify-center py-8">
      <p class="text-sm text-dimmed">
        No position data available
      </p>
    </div>
  </div>
</template>
