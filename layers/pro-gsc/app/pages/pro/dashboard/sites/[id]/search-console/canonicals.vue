<script lang="ts" setup>
import { CurveType } from '@unovis/ts'
import { VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import { h } from 'vue'
import { ProStatusBadge, UIcon } from '#components'
import ProGscTableShell from '#layers/pro-gsc/app/components/pro/ProGscTableShell.vue'
import { useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'

definePageMeta({ proTab: { feature: 'search-console', label: 'Canonicals', icon: 'i-lucide-link', order: 50 } })

const { siteStatus, gscdumpSiteId } = useSite('Canonicals')
const { getCanonicalMismatches } = useProGscdump()

interface Mismatch {
  url: string
  userCanonical: string
  googleCanonical: string
  verdict: string | null
  coverageState: string | null
  lastCheckedAt: string | null
}
interface ConsolidationTarget { google_canonical: string, count: number }
interface TrendPoint { date: string, count: number }
interface CanonicalData {
  mismatches: Mismatch[]
  totalCount: number
  consolidationTargets: ConsolidationTarget[]
  trend: TrendPoint[]
}

const { data, status } = useAsyncData(
  computed(() => `canonicals:${gscdumpSiteId.value}`),
  async () => {
    if (!gscdumpSiteId.value)
      return null
    return getCanonicalMismatches<CanonicalData>({ params: { siteId: gscdumpSiteId.value } }, true)
  },
  { server: false, watch: [gscdumpSiteId] },
)

// Search + pagination for ProGscTableShell
const q = ref('')
const page = ref(1)
const pageSize = 25

const filtered = computed(() => {
  if (!data.value?.mismatches)
    return []
  if (!q.value)
    return data.value.mismatches
  const search = q.value.toLowerCase()
  return data.value.mismatches.filter(m =>
    m.url.toLowerCase().includes(search)
    || m.userCanonical.toLowerCase().includes(search)
    || m.googleCanonical.toLowerCase().includes(search),
  )
})

watch(q, () => {
  page.value = 1
})

// Table columns
const columns = computed(() => [
  {
    accessorKey: 'url',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'URL'),
    cell: ({ row }: any) => {
      const r = row.original as Mismatch
      return h('div', { class: 'flex flex-col gap-1 min-w-0' }, [
        h('a', {
          href: r.url,
          target: '_blank',
          rel: 'noopener',
          class: 'text-sm truncate max-w-xs hover:text-primary transition-colors',
        }, getPath(r.url)),
        h('div', { class: 'flex items-center gap-1.5 text-[13px] text-muted' }, [
          h('span', { class: 'truncate max-w-[200px]', title: r.userCanonical }, `You: ${getPath(r.userCanonical)}`),
          h(UIcon, { name: 'i-lucide-arrow-right', class: 'size-3 shrink-0 text-dimmed' }),
          h('span', { class: 'truncate max-w-[200px] text-warning', title: r.googleCanonical }, `Google: ${getPath(r.googleCanonical)}`),
        ]),
      ])
    },
  },
  {
    accessorKey: 'verdict',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Verdict'),
    meta: { align: 'right' as const },
    cell: ({ row }: any) => {
      const r = row.original as Mismatch
      return h(ProStatusBadge, {
        status: r.verdict === 'PASS' ? 'success' : r.verdict === 'FAIL' ? 'error' : 'neutral',
        label: r.verdict || 'Unknown',
        size: 'sm',
      })
    },
  },
])

const tableData = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize).map((r, i) => ({ ...r, id: r.url || String(i) }))
})

// Chart
const trendX = (_: TrendPoint, i: number) => i
const trendY = (d: TrendPoint) => d.count ?? 0
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function trendTemplate(d: TrendPoint) {
  const date = dateFormatter.format(new Date(`${d.date}T00:00:00`))
  return `<div class="text-[13px] tabular-nums"><div class="font-medium text-default">${date}</div><div class="text-muted">${d.count} mismatches</div></div>`
}
</script>

<template>
  <div>
    <Alert
      v-if="siteStatus === 'error'"
      color="error"
      title="Failed to load site data."
    >
      <template #action>
        <UButton size="xs" color="neutral" variant="subtle" to="/pro/dashboard">
          Back to Sites
        </UButton>
      </template>
    </Alert>

    <template v-else>
      <!-- Loading -->
      <template v-if="status === 'pending'">
        <ProPageZone tier="primary" first>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="i in 2" :key="i" class="rounded-lg bg-default p-3 border border-default">
              <UiSkeleton :lines="2" :base="80" :range="40" />
            </div>
          </div>
          <Card>
            <UiSkeleton :lines="4" :base="180" :range="80" />
          </Card>
        </ProPageZone>
      </template>

      <!-- Data -->
      <template v-else-if="data?.totalCount">
        <ProPageZone tier="primary" first>
          <!-- Summary -->
          <div class="grid grid-cols-2 gap-4">
            <MetricCard
              label="Canonical Mismatches"
              :value="formatNumber(data.totalCount)"
            />
            <MetricCard
              label="Consolidation Targets"
              :value="String(data.consolidationTargets?.length || 0)"
            />
          </div>

          <!-- Trend -->
          <Card v-if="data.trend?.length">
            <template #header>
              <span class="text-sm font-medium">Mismatch Trend</span>
            </template>
            <ClientOnly>
              <VisXYContainer :data="data.trend" :height="160">
                <VisLine :x="trendX" :y="trendY" color="#f59e0b" :line-width="2" :curve-type="CurveType.MonotoneX" />
                <VisAxis type="x" :tick-format="(i: number) => data!.trend[i]?.date ? dateFormatter.format(new Date(`${data!.trend[i].date}T00:00:00`)) : ''" :num-ticks="7" />
                <VisAxis type="y" />
                <VisCrosshair :template="trendTemplate" />
                <VisTooltip />
              </VisXYContainer>
              <template #fallback>
                <UiSkeleton :lines="3" :base="180" :range="80" />
              </template>
            </ClientOnly>
          </Card>
        </ProPageZone>

        <ProPageZone tier="secondary">
          <!-- Consolidation Targets -->
          <DataList
            v-if="data.consolidationTargets?.length"
            title="Google's Chosen Canonicals"
            tooltip="The canonical URLs Google is consolidating your pages to. High counts may indicate duplicate content or unwanted canonicalization."
            :items="data.consolidationTargets"
          >
            <template #default="{ item }">
              <a
                :href="item.google_canonical"
                target="_blank"
                rel="noopener"
                class="text-sm truncate max-w-[320px] hover:text-primary transition-colors"
                :title="item.google_canonical"
              >
                {{ getPath(item.google_canonical) }}
              </a>
              <span class="text-sm tabular-nums text-muted">{{ item.count }} pages</span>
            </template>
          </DataList>

          <!-- Full Mismatch Table via ProGscTableShell -->
          <ProGscTableShell
            search-placeholder="Search URLs..."
            empty-icon="i-lucide-link-2"
            empty-title="No mismatches found"
            empty-default-description="No canonical mismatches detected."
            item-label="mismatches"
            :searchable="true"
            :page-size="pageSize"
            :q="q"
            :filter="undefined"
            :is-loading="false"
            :error="null"
            :rows="filtered"
            :total="filtered.length"
            :page="page"
            :columns="columns"
            :table-data="tableData"
            @update:q="q = $event"
            @update:page="page = $event"
          />
        </ProPageZone>
      </template>

      <!-- Empty -->
      <EmptyState
        v-else
        icon="i-lucide-link-2"
        title="No canonical mismatches"
        description="No URLs were found where Google's chosen canonical differs from yours. This data requires URL inspection to be collected first."
      />
    </template>
  </div>
</template>
