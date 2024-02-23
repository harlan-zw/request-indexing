<script lang="ts" setup>
defineProps<{ trendingContent: { clicks: number, url: string, keyword: string }[] }>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-bold flex items-center gap-2">
        <UIcon name="i-heroicons-presentation-chart-line" /> Trending Pages
      </div>
    </template>
    <div class="space-y-5">
      <div v-for="(row, i) in trendingContent" :key="i">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="text-gray-600 text-sm">{{ row.url }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1">
              <UTooltip :text="`${row.clicks} estimated clicks`">
                <IconClicks />
              </UTooltip>
              <TrendPercentage :value="row.clicks" :prev-value="row.prevClicks" />
            </div>
          </div>
        </div>
        <div class="text-xs text-gray-600">
          <PositionMetric :value="row.keywordPosition" />
          {{ row.keyword }}
        </div>
        <UDivider v-if="i !== trendingContent.length - 1" class="mt-3" />
      </div>
    </div>
  </UCard>
</template>
