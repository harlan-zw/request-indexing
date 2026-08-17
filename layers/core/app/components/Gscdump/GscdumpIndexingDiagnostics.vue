<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status, error, refresh } = useGscdumpIndexingDiagnostics(() => props.siteId)

type SeverityColor = 'error' | 'warning' | 'info' | 'neutral'

const severityColor: Record<string, SeverityColor> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
}

// `text-${color}-500` is not a real Tailwind class here and produced no colour
// at all once the palette moved to semantic tokens.
const severityIconClass: Record<SeverityColor, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  neutral: 'text-muted',
}

const severityIcon: Record<string, string> = {
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle',
}

const issues = computed(() => data.value?.issues ?? [])

function colorFor(severity: string): SeverityColor {
  return severityColor[severity] ?? 'neutral'
}
</script>

<template>
  <AsyncCardState
    :status="status"
    :error="error"
    :empty="!issues.length"
    label="diagnostics"
    min-height="min-h-24"
    :rows="3"
    @retry="refresh()"
  >
    <template #empty>
      <UIcon name="i-lucide-check-circle" class="size-6 text-success" />
      <div>
        <p class="font-medium text-highlighted">
          No indexing issues
        </p>
        <p class="text-sm text-muted">
          Google reported no issues for the inspected URLs.
        </p>
      </div>
    </template>
    <div class="space-y-2">
      <div
        v-for="issue in issues"
        :key="issue.type"
        class="flex items-center justify-between py-2 px-3 rounded-lg border border-default"
      >
        <div class="flex items-center gap-2">
          <UIcon
            :name="severityIcon[issue.severity] || severityIcon.info"
            class="w-4 h-4"
            :class="severityIconClass[colorFor(issue.severity)]"
          />
          <span class="text-sm">{{ issue.label }}</span>
          <UBadge :color="colorFor(issue.severity)" variant="subtle" size="xs">
            {{ issue.severity }}
          </UBadge>
        </div>
        <span class="text-sm font-mono tabular-nums">{{ issue.count }}</span>
      </div>
    </div>
  </AsyncCardState>
</template>
