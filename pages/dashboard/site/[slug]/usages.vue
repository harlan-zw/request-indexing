<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Settings',
  subTitle: 'API Usages',
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
          <span>API Usages</span>
        </h2>
        <div class="text-gray-500 text-sm mb-4">
          The total amount of data downloaded from Google Search Console for your site property.
        </div>
        <div class="text-sm mb-4 space-y-4">
          <div>
            <div class="mb-1">
              Google Search Console
            </div>
            <UProgress value="50" />
          </div>
          <div>
            <div class="mb-1">
              Web Indexing
            </div>
            <UProgress value="50" />
          </div>
          <div>
            CrUX
            <UProgress value="50" />
          </div>
          <div>
            Google Adwords
            <UProgress value="50" />
          </div>
          <div>
            PageSpeed Insights
            <UProgress value="50" />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
