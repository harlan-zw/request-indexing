<script setup lang="ts">
import type { JobSelect, UserSelect } from '~/server/database/schema'

definePageMeta({
  layout: 'admin-dashboard',
  title: 'Admin Jobs',
  icon: 'i-ph-app-window-duotone',
})

const data = ref<UserSelect[]>([])

onMounted(async () => {
  data.value = await $fetch('/api/admin/jobs')
})

const columns: { key: keyof JobSelect, label: string }[] = [
  {
    key: 'jobId',
    label: 'ID',
  },
  {
    key: 'queue',
    label: 'Queue',
  },
  {
    key: 'priority',
    label: 'Priority',
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
    label: 'Payload',
  },
  {
    key: 'response',
    label: 'Response',
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

const filters = [
  {
    key: 'failed',
    label: 'Failed',
    filter: (rows: JobSelect[]) => {
      return rows.filter(row => row.status === 'failed')
    },
  },
  {
    key: 'pending',
    label: 'Pending',
    filter: (rows: JobSelect[]) => {
      return rows.filter(row => row.status === 'pending')
    },
  },
]

function retry(row: JobSelect) {
  $fetch(`/api/jobs/${row.jobId}/retry`, {
    method: 'POST',
  })
}
</script>

<template>
  <div>
    <TableData :value="data" :columns="columns" :filters="filters">
      <template #timeTaken-data="{ row }">
        <span v-if="row.timeTaken">{{ useHumanMs(row.timeTaken) }}</span>
        <span v-else>-</span>
      </template>
      <template #status-data="{ row }">
      <UTooltip :text="row.status">
        <UIcon v-if="row.status === 'completed'" name="i-ph-check-fat-duotone" class="text-green-500" />
        <UIcon v-else-if="row.status === 'failed'" name="i-ph-x-duotone" class="text-red-500" />
        <UIcon v-else name="i-ph-circle-duotone" class="text-yellow-500" />
      </UTooltip>
      </template>
      <template #createdAt-data="{ row }">
        <span>{{ useTimeAgo(row.createdAt) }}</span>
      </template>
      <template #payload-data="{ row }">
        <pre>{{ JSON.stringify(row.payload, null, 2).replace('{', '').replace('}', '').split('\n').map(s => s.trim()).join('\n').trim() }}</pre>
      </template>
      <template #response-data="{ row }">
        <div v-if="row.response">
          <div>{{ JSON.parse(row.response).status }}</div>
          <pre>{{ JSON.parse(row.response).body }}</pre>
        </div>
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
