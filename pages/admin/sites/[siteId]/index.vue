<script lang="ts" setup>
import { useHumanFriendlyNumber } from '../../../../composables/formatting'
import type { JobSelect, SiteSelect } from '~/server/database/schema'

definePageMeta({
  layout: 'admin-dashboard',
  title: 'Site',
  icon: 'i-ph-app-window-duotone',
})

const siteId = useRoute().params.siteId

const data = ref<SiteSelect | null>(null)

onMounted(async () => {
  data.value = await $fetch(`/api/sites/${siteId}`)
})

const columns: { key: keyof JobSelect, label: string }[] = [
  {
    key: 'jobId',
    label: 'ID',
  },
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'status',
    label: 'Status',
  },
  {
    key: 'payload',
    label: 'Payolad',
  },
  {
    key: 'timeTaken',
    label: 'Time taken',
  },
  {
    key: 'exceptions',
    label: 'Exceptions',
  },
  {
    key: 'createdAt',
    label: 'Created At',
  },
  {
    key: 'actions',
    label: 'Actions',
  },
]
</script>

<template>
  <div v-if="data">
    <div class="mb-10">
      <div v-for="key in Object.keys(data?.site || {})" :key="key" class="grid grid-cols-6 py-1 border-b-gray-100 border-b-2">
        <span>{{ key }}</span>
        <span class="col-span-5">{{ data.site[key] }}</span>
      </div>
    </div>
    <div v-if="data.pageCount?.length" class="mb-7">
      <h2 class="mb-3 font-bold">
        Web Indexing
      </h2>
      <div>Non-Indexed pages: {{ data.pageCount[0]?.count || 0 }}</div>
      <div>Indexed pages: {{ data.pageCount[1]?.count || 0 }}</div>
      <div v-if="data.pageCount[1]">Percent: {{ useHumanFriendlyNumber(data.pageCount[1].count / data.pageCount[0].count * 100) }}%</div>
    </div>
    <h2 class="mb-3 font-bold">
      Jobs
    </h2>
    <TableData v-if="data?.jobs" :value="data.jobs" :columns="columns">
      <template #timeTaken-data="{ row }">
        <span v-if="row.timeTaken">{{ useHumanMs(row.timeTaken) }}</span>
        <span v-else>-</span>
      </template>
      <template #status-data="{ row }">
        <UIcon v-if="row.status === 'completed'" name="i-ph-check-fat-duotone" class="text-green-500" />
        <UIcon v-else-if="row.status === 'failed'" name="i-ph-x-duotone" class="text-red-500" />
        <UIcon v-else name="i-ph-circle-duotone" class="text-yellow-500" />
      </template>
      <template #createdAt-data="{ row }">
        <span>{{ useTimeAgo(row.createdAt) }}</span>
      </template>
      <template #payload-data="{ row }">
        <pre>{{ JSON.stringify(row.payload, null, 2).replace('{', '').replace('}', '').split('\n').map(s => s.trim()).join('\n').trim() }}</pre>
      </template>
      <template #exceptions-data="{ row }">
        <div v-for="fail in row.failedJobs" :key="fail.id">
          {{ fail.failedAt }}
        </div>
      </template>
      <template #actions-data="{ row }">
        <UButton size="xs" color="gray" @click="retry(row)">
          Retry
        </UButton>
      </template>
    </TableData>
  </div>
</template>
