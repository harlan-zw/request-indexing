<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

const { data } = await fetchSites()

const sites = computed(() => {
  return (data.value?.sites || [])
})
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:gap-10">
          <div class="mb-3 md:mb-0">
            <h2 class="text-2xl font-bold mb-1 flex items-center gap-2">
              <UIcon name="i-heroicons-rocket-launch" />
              <span>PageSpeed Insights</span>
            </h2>
          </div>
        </div>
      </div>
      <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 gap-7">
        <div v-for="(site) in sites" :key="site.siteUrl" />
      </div>
    </div>
  </UContainer>
</template>
