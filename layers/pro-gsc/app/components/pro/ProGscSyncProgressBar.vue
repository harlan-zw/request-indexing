<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, refresh, isProcessing, isFullySynced, daysSynced } = useProGscStatus(() => props.siteId)

// Auto-refresh every 10s while syncing
const refreshInterval = ref<ReturnType<typeof setInterval>>()

watch(isProcessing, (processing) => {
  if (processing && !refreshInterval.value) {
    refreshInterval.value = setInterval(refresh, 10000)
  }
  else if (!processing && refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = undefined
  }
}, { immediate: true })

onUnmounted(() => {
  if (refreshInterval.value)
    clearInterval(refreshInterval.value)
})

const progressPercent = computed(() => data.value?.syncProgress?.percent || 0)
const progressText = computed(() => {
  if (!data.value?.syncProgress)
    return 'Starting sync...'
  const { completed, total, percent } = data.value.syncProgress
  return `Syncing ${percent}% (${completed}/${total} jobs)${daysSynced.value > 0 ? ` · ${daysSynced.value} days synced` : ''}`
})
</script>

<template>
  <ProAlert
    v-if="isProcessing && !isFullySynced"
    color="info"
    icon="i-lucide-refresh-cw"
    :description="progressText"
  >
    <template #action>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-refresh-cw"
        @click="refresh"
      />
    </template>
    <template #progress>
      <div class="h-1 bg-info/10">
        <div
          class="h-full bg-info transition-[width] duration-500"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </template>
  </ProAlert>
</template>
