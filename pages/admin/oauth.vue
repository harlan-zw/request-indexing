<script setup lang="ts">
import type { GoogleOAuthClientsSelect } from '~/server/database/schema'

definePageMeta({
  layout: 'admin-dashboard',
  title: 'Admin OAuth Clients',
  icon: 'i-ph-lock-duotone',
})

const data = ref<{ usage: GoogleOAuthClientsSelect[], free: GoogleOAuthClientsSelect }>()

onMounted(async () => {
  data.value = await $fetch('/api/admin/oauth')
})

const columns: { key: keyof GoogleOAuthClientsSelect | 'count', label: string }[] = [
  {
    key: 'googleOAuthClientId',
    label: 'ID',
  },
  {
    key: 'label',
    label: 'Name',
  },
  {
    key: 'count',
    label: 'Auth Count',
  },
  {
    key: 'reserved',
    label: 'Reserved',
  },
]
</script>

<template>
  <div>
    <UDashboardCard v-if="data?.free" title="Next Free" description="The next free OAuth client." class="mb-5">
      {{ data.free.label }}
    </UDashboardCard>
    <TableData :value="data?.usage || []" :columns="columns" />
  </div>
</template>
