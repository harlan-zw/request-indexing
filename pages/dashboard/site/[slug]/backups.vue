<script lang="ts" setup>
import { useFriendlySiteUrl } from '~/composables/formatting'

defineProps<{ graph: any }>()

definePageMeta({
  title: 'Backups',
  icon: 'i-heroicons-circle-stack',
})

useHead({
  title: 'Backups',
})
</script>

<template>
  <div>
    <div v-if="!isPending && selectedSites.filter(s => s.isLosingData).length" class="mt-12">
      <UDivider class="my-12" />
      <div class="mb-7">
        <h2 class="text-xl mb-2 font-bold flex items-center gap-3">
          <UIcon name="i-carbon-data-backup" class="w-6 h-6 hidden md:block" />
          Configure Google Search Console Backups
        </h2>
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Google Search Console only stores your data for 16 months, you can backup your data so you never lose it.
        </p>
      </div>
      <ul class="mb-7 space-y-5">
        <li class="flex items-center gap-1">
          <UIcon name="i-heroicons-check" class="w-5 h-5" /> Backup your data before it gets deleted after 16 months, view and download it at any time.
        </li>
        <li class="flex items-center gap-1">
          <UIcon name="i-heroicons-check" class="w-5 h-5" /> See larger trends in your search performance on the dashboard.
        </li>
      </ul>
      <label class="flex items-center dark:text-gray-300 text-gray-600 font-bold gap-3 mb-7">
        <UToggle v-model="backups" color="blue" size="2xl" />
        <div>Enable Backups</div>
      </label>
      <div>
        <p class="mb-3">
          Google Search Console is <strong>currently deleting</strong> data for the below domains because they were created 16 months ago.
        </p>
        <ul class="list-disc md:ml-7 text-center space-y-3 flex flex-col mb-7">
          <li v-for="(s, key) in selectedSites.filter(s => s.isLosingData)" :key="key" class="flex items-center gap-2 text-lg">
            <UIcon v-if="!backups" name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-500" />
            <SiteFavicon :site="s" />
            <h3 class="font-bold">
              {{ useFriendlySiteUrl(s.domain) }}
            </h3>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
