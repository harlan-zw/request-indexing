<script setup lang="ts">
import type { GoogleOAuthClientsSelect } from '#shared/types/database'

definePageMeta({
  layout: 'admin',
  title: 'Admin OAuth Clients',
})

const data = ref<{ usage: GoogleOAuthClientsSelect[], free: GoogleOAuthClientsSelect }>()

onMounted(async () => {
  data.value = await $fetch('/api/admin/oauth')
})

const columns: { key: keyof GoogleOAuthClientsSelect | 'count', label: string }[] = [
  { key: 'googleOAuthClientId', label: 'ID' },
  { key: 'label', label: 'Name' },
  { key: 'count', label: 'Auth Count' },
  { key: 'reserved', label: 'Reserved' },
]
</script>

<template>
  <div>
    <UCard v-if="data?.free" variant="subtle" class="mb-5">
      <template #header>
        <h3 class="font-semibold">
          Next Free
        </h3>
      </template>
      <p>{{ data.free.label }}</p>
    </UCard>
    <TableData :value="data?.usage || []" :columns="columns" />
  </div>
</template>
