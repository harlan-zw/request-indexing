<script setup lang="ts">
const links = [{
  label: 'Users',
  to: '/admin/users',
  icon: 'i-heroicons-user-circle',
}]

const usage = ref()

onMounted(async () => {
  usage.value = await $fetch('/api/admin/usage')
})
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UAside>
          <UNavigationTree title="test" :links="links" />
        </UAside>
      </template>
      <div>
        <UPageHeader title="Admin" description="Request Indexing Admin Portal" :links="[]" headline="Restricted" />
        <UPageBody>
          <h2 class="font-bold text-2xl mb-3">
            Usage
          </h2>
          <div v-if="usage">
            <div>Sign Ups: {{ usage.signups }}</div>
            <h3 class="mb-2 text-lg font-semibold">
              Web Indexing API
            </h3>
            <div>Used: {{ usage.webIndexingApi.used }}</div>
            <div>Free: {{ usage.webIndexingApi.free }}</div>
            <div>Slots left {{ 100 - Math.round(usage.webIndexingApi.used / usage.webIndexingApi.free * 100) }}%</div>
          </div>
        </UPageBody>
      </div>
    </UPage>
  </UContainer>
</template>
