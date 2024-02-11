<script setup lang="ts">
import { useTimeAgo } from '~/composables/formatting'
import type { SitePage } from '~/types'

const props = defineProps<{
  value: Required<SitePage>
}>()

const value = computed(() => {
  return props.value?.inspectionResult
})
</script>

<template>
  <div v-if="value?.indexStatusResult" class="flex items-center">
    <UPopover mode="hover">
      <template v-if="value.indexStatusResult.verdict === 'PASS'">
        <UButton :to="value.inspectionResultLink" icon="i-heroicons-check-circle" color="green" variant="link">
          <UChip color="green" />
        </UButton>
      </template>
      <template v-else-if="value.indexStatusResult.verdict === 'NEUTRAL'">
        <UButton :to="value.inspectionResultLink" icon="i-heroicons-clock" color="gray" variant="link">
          <UChip color="gray" />
        </UButton>
      </template>
      <template v-else-if="value.indexStatusResult.verdict === 'FAIL'">
        <UButton :to="value.inspectionResultLink" icon="i-heroicons-x-circle" color="red" variant="link">
          <UChip color="red" />
        </UButton>
      </template>
      <template #panel>
        <div class="p-4">
          <div>
            <div class="text-gray-800 dark:text-gray-100 font-semibold mb-2">
              {{ value.indexStatusResult.coverageState }}
            </div>
            <div class="flex gap-3 justify-between mb-1">
              <div class="text-gray-700 dark:text-gray-200">
                Verdict
              </div>
              <div>{{ value.indexStatusResult.verdict }}</div>
            </div>
            <div class="flex gap-3 justify-between mb-1">
              <div class="text-gray-700 dark:text-gray-200">
                Robots.txt
              </div>
              <div>{{ value.indexStatusResult.robotsTxtState }}</div>
            </div>
            <div class="flex gap-3 justify-between mb-1">
              <div class="text-gray-700 dark:text-gray-200">
                Indexing
              </div>
              <div>{{ value.indexStatusResult.indexingState }}</div>
            </div>
            <div class="flex gap-3 justify-between mb-1">
              <div class="text-gray-700 dark:text-gray-200">
                Last Crawled
              </div>
              <div>{{ useTimeAgo(value.indexStatusResult.lastCrawlTime, true) }}</div>
            </div>
          </div>
          <slot />
        </div>
      </template>
    </UPopover>
  </div>
</template>
