<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status } = useGscdumpIndexingDiagnostics(() => props.siteId)

const severityColor: Record<string, string> = {
  error: 'red',
  warning: 'yellow',
  info: 'blue',
}

const severityIcon: Record<string, string> = {
  error: 'i-heroicons-x-circle',
  warning: 'i-heroicons-exclamation-triangle',
  info: 'i-heroicons-information-circle',
}
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="flex items-center justify-center py-4">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>
    <template v-else-if="data?.issues?.length">
      <div class="space-y-2">
        <div
          v-for="issue in data.issues"
          :key="issue.type"
          class="flex items-center justify-between py-2 px-3 rounded-lg border border-gray-100 dark:border-gray-800"
        >
          <div class="flex items-center gap-2">
            <UIcon :name="severityIcon[issue.severity] || severityIcon.info" class="w-4 h-4" :class="`text-${severityColor[issue.severity] || 'gray'}-500`" />
            <span class="text-sm">{{ issue.label }}</span>
            <UBadge :color="severityColor[issue.severity] || 'gray'" variant="subtle" size="xs">
              {{ issue.severity }}
            </UBadge>
          </div>
          <span class="text-sm font-mono">{{ issue.count }}</span>
        </div>
      </div>
    </template>
    <div v-else class="text-sm text-gray-500 py-4">
      No indexing issues found.
    </div>
  </div>
</template>
