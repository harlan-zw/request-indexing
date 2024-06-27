<script setup lang="ts">
import type { UserSelect } from '~/server/database/schema'

definePageMeta({
  layout: 'admin-dashboard',
  title: 'Admin Users',
  icon: 'i-ph-app-window-duotone',
})

const data = ref<UserSelect[]>([])

onMounted(async () => {
  data.value = await $fetch('/api/admin/users')
})

const columns: { key: keyof UserSelect, label: string }[] = [
  {
    key: 'userId',
    label: 'ID',
  },
  {
    key: 'name',
    label: 'Name',
  },
  {
    key: 'email',
    label: 'Email',
  },
  {
    key: 'createdAt',
    label: 'Created At',
  },
  {
    key: 'updatedAt',
    label: 'Updated At',
  },
]
</script>

<template>
  <div>
    <TableData :value="data" :columns="columns" />
  </div>
</template>
