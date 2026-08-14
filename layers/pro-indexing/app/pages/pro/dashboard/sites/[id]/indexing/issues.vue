<script lang="ts" setup>
import type { IndexingIssueRow } from '#layers/pro-indexing/app/internal/composables/useIndexingPrompt'
import type { IssueSeverity } from '#layers/pro-indexing/app/utils/indexing-issues'
import { useProGscdumpIndexingDiagnostics } from '#layers/pro-gsc/app/composables/useProGscdump'
import { issueDetails, issueGroups, issueIcons, issueTypeToGroup } from '#layers/pro-indexing/app/utils/indexing-issues'

definePageMeta({ proTab: { feature: 'indexing', label: 'Issues', icon: 'i-lucide-alert-triangle', order: 10 } })

const { siteId, gscdumpSiteId } = useSite()

const generatePrompt = inject<(row: IndexingIssueRow) => Promise<void>>('indexing-generate-prompt')!

const { data: diagnosticsData } = useProGscdumpIndexingDiagnostics(
  computed(() => gscdumpSiteId.value ?? ''),
  { immediate: !!gscdumpSiteId.value },
)

interface IssueRow {
  id: string
  type: string
  label: string
  severity: IssueSeverity
  count: number
  icon: string
  description: string
  fix: string
}

const allIssues = computed<IssueRow[]>(() => {
  if (!diagnosticsData.value?.issues)
    return []
  return diagnosticsData.value.issues
    .filter(i => i.count > 0 && i.type !== 'not_indexed')
    .sort((a, b) => {
      const order: Record<string, number> = { error: 0, warning: 1, info: 2 }
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3) || b.count - a.count
    })
    .map(i => ({
      id: i.type,
      type: i.type,
      label: i.label,
      severity: i.severity,
      count: i.count,
      icon: issueIcons[i.type] || 'i-lucide-alert-circle',
      description: issueDetails[i.type]?.description || '',
      fix: issueDetails[i.type]?.fix || '',
    }))
})

const loading = computed(() => !diagnosticsData.value)
const errorCount = computed(() => allIssues.value.filter(r => r.severity === 'error').reduce((sum, r) => sum + r.count, 0))
const warningCount = computed(() => allIssues.value.filter(r => r.severity === 'warning').reduce((sum, r) => sum + r.count, 0))

const errorIssueCount = computed(() => allIssues.value.filter(r => r.severity === 'error').length)
const warningIssueCount = computed(() => allIssues.value.filter(r => r.severity === 'warning').length)

const heroStats = computed(() => [
  {
    title: 'Errors',
    tooltip: 'Issues preventing pages from being indexed',
    value: useProHumanFriendlyNumber(errorCount.value),
    suffix: `across ${errorIssueCount.value} issue${errorIssueCount.value === 1 ? '' : ' types'}`,
    icon: 'i-lucide-alert-triangle',
    status: errorCount.value > 0 ? 'crisis' as const : 'good' as const,
  },
  {
    title: 'Warnings',
    tooltip: 'Issues that may affect indexing quality',
    value: useProHumanFriendlyNumber(warningCount.value),
    suffix: `across ${warningIssueCount.value} issue${warningIssueCount.value === 1 ? '' : ' types'}`,
    icon: 'i-lucide-alert-circle',
    status: warningCount.value > 10 ? 'warning' as const : warningCount.value > 0 ? 'good' as const : undefined,
  },
])

const grouped = computed(() => {
  return issueGroups
    .map(group => ({
      group,
      issues: allIssues.value.filter(r => issueTypeToGroup[r.type] === group.id),
    }))
    .filter(g => g.issues.length > 0)
})

const expanded = ref(new Set<string>())
function toggle(type: string) {
  expanded.value.has(type) ? expanded.value.delete(type) : expanded.value.add(type)
}

const generatingFor = ref<string>()
async function onGenerate(row: IssueRow) {
  generatingFor.value = row.type
  await generatePrompt(row)
  generatingFor.value = undefined
}

function urlsRoute(query?: Record<string, string>) {
  const base = `/pro/dashboard/sites/${siteId.value}/indexing/urls`
  if (!query || Object.keys(query).length === 0)
    return base
  const qs = new URLSearchParams(query).toString()
  return `${base}?${qs}`
}

function groupIssueCount(issues: IssueRow[]) {
  return issues.reduce((sum, r) => sum + r.count, 0)
}
</script>

<template>
  <ProPageStates
    :status="loading ? 'pending' : 'success'"
    :empty="!loading && !allIssues.length"
  >
    <template #loading>
      <Card>
        <UiSkeleton :lines="6" :base="200" :range="100" />
      </Card>
    </template>

    <template #empty>
      <EmptyState
        icon="i-lucide-shield-check"
        title="All clear"
        description="No indexing issues found. Every crawled URL is healthy and accessible to Googlebot."
      >
        <div class="flex items-center justify-center gap-5">
          <SeverityDot severity="success" label="0 errors" />
          <SeverityDot severity="success" label="0 warnings" />
        </div>
      </EmptyState>
    </template>

    <div class="flex flex-col *:min-w-0">
      <!-- Hero: severity stat cards -->
      <ProPageZone tier="primary" first>
        <UiStats :data="heroStats" variant="cards" />
      </ProPageZone>

      <ProPageZone tier="secondary">
        <ProEducationPanel
          what="Indexing issues are problems preventing Google from adding your pages to search results. They range from configuration errors (quick fixes) to content quality signals (longer term work)."
          why="Pages that aren't indexed can't appear in Google Search. Fixing errors first gives the highest ROI, then work through warnings."
          :actions="[
            'Start with Quick Wins: one-line config changes that unblock indexing',
            'Fix Technical issues next: server errors and broken URLs waste crawl budget',
            'Expand each issue for a description, fix guide, and AI prompt',
          ]"
        />

        <!-- Issue groups -->
        <div v-for="{ group, issues } in grouped" :key="group.id" class="space-y-2">
          <!-- Group header -->
          <ProSectionHeader
            :title="group.label"
            :icon="group.icon"
            :icon-class="group.id === 'quick-wins' ? 'text-success' : group.id === 'expected' ? 'text-dimmed' : 'text-muted'"
            :badge="useProHumanFriendlyNumber(groupIssueCount(issues))"
            :badge-status="group.id === 'quick-wins' ? 'success' : group.id === 'technical' ? 'error' : group.id === 'content-discovery' ? 'warning' : 'neutral'"
            :tooltip="group.education"
          />

          <!-- Issue cards -->
          <Card class="[&_[data-card-body]]:!p-0">
            <div v-for="row in issues" :key="row.type" class="border-b border-default last:border-b-0">
              <!-- Row -->
              <button
                class="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-[var(--ui-bg-accented)]/50 transition-colors duration-150"
                @click="toggle(row.type)"
              >
                <SeverityDot :severity="row.severity" />
                <ProNavIcon :icon="row.icon" />
                <span class="text-sm truncate flex-1" :class="group.id === 'expected' ? 'text-muted' : 'text-default'">{{ row.label }}</span>
                <span class="text-[13px] font-semibold tabular-nums shrink-0" :class="group.id === 'expected' ? 'text-muted' : 'text-default'">{{ useProHumanFriendlyNumber(row.count) }}</span>
                <UIcon
                  name="i-lucide-chevron-down"
                  class="size-3 text-dimmed shrink-0 transition-transform duration-150"
                  :class="{ 'rotate-180': expanded.has(row.type) }"
                />
              </button>

              <!-- Detail panel -->
              <div v-if="expanded.has(row.type)" class="px-4 pb-3 pt-1 ml-11 space-y-3 border-t border-default/30">
                <p class="text-[13px] text-muted leading-relaxed">
                  {{ row.description }}
                </p>

                <div class="flex items-start gap-2 rounded-lg bg-[var(--ui-bg-muted)]/50 p-3">
                  <UIcon name="i-lucide-lightbulb" class="size-3.5 shrink-0 mt-0.5 text-dimmed" />
                  <div class="min-w-0">
                    <MetricLabel>How to fix</MetricLabel>
                    <p class="text-[13px] text-default leading-relaxed whitespace-pre-line mt-0.5">
                      {{ row.fix }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <UiMotionButton :to="urlsRoute({ issue: row.type })" size="xs" color="primary" variant="subtle" trailing-icon="i-lucide-arrow-right">
                    View {{ useProHumanFriendlyNumber(row.count) }} URLs
                  </UiMotionButton>
                  <UiMotionButton size="xs" color="neutral" variant="subtle" icon="i-lucide-sparkles" :loading="generatingFor === row.type" @click.stop="onGenerate(row)">
                    AI Fix Prompt
                  </UiMotionButton>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </ProPageZone>
    </div>
  </ProPageStates>
</template>
