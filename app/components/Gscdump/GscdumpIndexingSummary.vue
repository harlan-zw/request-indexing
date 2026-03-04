<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status } = useGscdumpIndexing(() => props.siteId)

const trendGraph = computed(() => {
  if (!data.value?.trend?.length)
    return []
  return data.value.trend.map(t => ({
    date: t.date,
    clicks: t.indexedCount,
    impressions: t.totalUrls,
    position: t.notIndexedCount,
  }))
})
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="flex items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>
    <template v-else-if="data?.summary">
      <div class="grid grid-cols-4 gap-4 mb-6">
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div class="text-xs text-gray-500">
            Total URLs
          </div>
          <div class="text-2xl font-mono font-bold">
            {{ useHumanFriendlyNumber(data.summary.totalUrls) }}
          </div>
        </UCard>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div class="text-xs text-gray-500">
            Indexed
          </div>
          <div class="text-2xl font-mono font-bold text-green-600">
            {{ useHumanFriendlyNumber(data.summary.indexed) }}
          </div>
        </UCard>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div class="text-xs text-gray-500">
            Not Indexed
          </div>
          <div class="text-2xl font-mono font-bold text-red-500">
            {{ useHumanFriendlyNumber(data.summary.notIndexed) }}
          </div>
        </UCard>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div class="text-xs text-gray-500">
            Indexed %
          </div>
          <div class="text-2xl font-mono font-bold">
            {{ data.summary.indexedPercent }}%
          </div>
          <UProgress :value="data.summary.indexedPercent" color="green" size="xs" class="mt-1" />
        </UCard>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div v-if="data.summary.change7d != null">
          <span class="text-xs text-gray-500">7d change:</span>
          <span class="text-sm font-mono ml-1" :class="data.summary.change7d >= 0 ? 'text-green-600' : 'text-red-500'">
            {{ data.summary.change7d > 0 ? '+' : '' }}{{ data.summary.change7d }}
          </span>
        </div>
        <div v-if="data.summary.change28d != null">
          <span class="text-xs text-gray-500">28d change:</span>
          <span class="text-sm font-mono ml-1" :class="data.summary.change28d >= 0 ? 'text-green-600' : 'text-red-500'">
            {{ data.summary.change28d > 0 ? '+' : '' }}{{ data.summary.change28d }}
          </span>
        </div>
      </div>

      <div v-if="data.trend?.length" class="mb-6">
        <div class="text-xs text-gray-500 mb-2">
          Indexing Trend
        </div>
        <GraphDataNext :height="120" :value="trendGraph" :columns="['clicks', 'impressions']" />
      </div>

      <div v-if="data.trend?.length" class="grid grid-cols-2 gap-6">
        <div v-if="data.trend[data.trend.length - 1]?.issues">
          <div class="text-xs text-gray-500 mb-2 font-semibold">
            Issues
          </div>
          <div class="space-y-1">
            <div v-for="(count, issue) in data.trend[data.trend.length - 1].issues" :key="issue" class="flex justify-between text-xs">
              <span class="text-gray-600 capitalize">{{ String(issue).replace(/([A-Z])/g, ' $1').trim() }}</span>
              <span class="font-mono">{{ count }}</span>
            </div>
          </div>
        </div>
        <div v-if="data.trend[data.trend.length - 1]?.coverage">
          <div class="text-xs text-gray-500 mb-2 font-semibold">
            Coverage
          </div>
          <div class="space-y-1">
            <div v-for="(count, state) in data.trend[data.trend.length - 1].coverage" :key="state" class="flex justify-between text-xs">
              <span class="text-gray-600 capitalize">{{ String(state).replace(/([A-Z])/g, ' $1').trim() }}</span>
              <span class="font-mono">{{ count }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="text-sm text-gray-500 py-4">
      No indexing data available.
    </div>
  </div>
</template>
