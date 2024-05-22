<script setup lang="ts">
import type { SiteSelect, UserSelect } from '~/server/database/schema'

definePageMeta({
  layout: 'admin-dashboard',
  title: 'Admin Sites',
  icon: 'i-ph-app-window-duotone',
})

const data = ref<UserSelect[]>([])

onMounted(async () => {
  data.value = await $fetch('/api/admin/sites')
})

const columns: { key: keyof SiteSelect, label: string }[] = [
  {
    key: 'publicId',
    label: 'Public ID',
  },
  {
    key: 'domain',
    label: 'Domain',
  },
  {
    key: 'createdAt',
    label: 'Created At',
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
  },
  {
    key: 'actions',
    label: 'Actions',
  },
]

function deleteSite(site: SiteSelect) {
  $fetch(`/api/sites/${site.siteId}`, { method: 'DELETE' })
}
</script>

<template>
  <div>
    <TableData :value="data" :columns="columns">
      <template #publicId-data="{ row }">
        <NuxtLink :to="`/admin/sites/${row.publicId}`" class="underline">
          {{ row.publicId }}
        </NuxtLink>
      </template>
      <template #createdAt-data="{ row }">
        <span>{{ useTimeAgo(row.createdAt) }}</span>
      </template>
      <template #updatedAt-data="{ row }">
        <span>{{ useTimeAgo(row.updatedAt) }}</span>
      </template>
      <template #actions-data="{ row }">
        <UButton size="xs" color="gray" @click="deleteSite(row)">
          Delete
        </UButton>
      </template>
    </TableData>
  </div>
</template>
