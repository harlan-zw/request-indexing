<script setup lang="ts">
import type { SiteSelect } from '#shared/types/database'

definePageMeta({
  layout: 'admin',
  title: 'Admin Sites',
})

const data = ref<SiteSelect[]>([])

onMounted(async () => {
  data.value = await $fetch('/api/admin/sites')
})

const columns: { key: string, label: string }[] = [
  { key: 'publicId', label: 'Public ID' },
  { key: 'domain', label: 'Domain' },
  { key: 'createdAt', label: 'Created At' },
  { key: 'updatedAt', label: 'Updated At' },
  { key: 'actions', label: 'Actions' },
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
        <UButton size="xs" color="neutral" @click="deleteSite(row)">
          Delete
        </UButton>
      </template>
    </TableData>
  </div>
</template>
