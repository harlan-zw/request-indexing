<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Google Search Console',
  icon: 'i-heroicons-check-circle',
})

const siteData = useSiteData(props.site)
const { data } = siteData.gscStats()
</script>

<template>
  <div v-if="data">
    <div class="flex gap-3 mb-3">
      <h2 class="mb-2 flex items-center text-sm font-semibold">
        Property {{ site.property }}
      </h2>
      <div class="text-sm text-gray-500">
        Permission: {{ data.permissionLevel }}
      </div>
    </div>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <h2 class="mb-3 flex items-center text-lg font-semibold gap-1">
          <UIcon name="i-ph-database-duotone" class="w-5 h-5 text-gray-500" />
          <span>Data Ingestion</span>
        </h2>
        <div class="text-gray-500 text-sm mb-4">
          The total amount of data downloaded from Google Search Console for your site property.
        </div>
        <div class="text-sm mb-4">
          <div class="text-3xl font-bold mb-2 flex items-center gap-3">
            <div>{{ Math.min(data.ingestedPercent, 100) }}%</div>
            <div class="text-sm font-normal">
              {{ data.daysDiff }} days
            </div>
          </div>
          <UProgress :value="data.ingestedPercent" color="blue" class="mt-1 mb-4" />
          <div class="text-xl font-bold mb-2 flex items-center gap-3">
            <div>{{ Math.round(data.dataSizeEstimate / 1024) }}KB</div>
          </div>
        </div>
      </UCard>
      <UCard>
        <h2 class="mb-3 flex items-center text-lg font-semibold gap-1">
          <UIcon name="i-ph-file-archive-duotone" class="w-5 h-5 text-gray-500" />
          <span>Archived data</span>
        </h2>
        <div class="text-gray-500 text-sm mb-4">
          Google Search Console deletes your site data after 16 months, Request Indexing archives it for you.
        </div>
        <div class="text-sm mb-4">
          <div v-if="(data.daysDiff - 500) > 0" class="text-3xl font-bold mb-2 flex items-center gap-3">
            <div>{{ data.daysDiff - 500 }}</div>
            <div class="text-sm font-normal">
              days saved
            </div>
          </div>
          <div class="text-3xl font-bold mb-2 flex items-center gap-3">
            <div>{{ 500 - data.daysDiff }}</div>
            <div class="text-sm font-normal">
              days until data is deleted from Search Console
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
