<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'
import { contains, query } from 'gscdump/query'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})

const keyword = useRoute().params.keyword as string

const router = useRouter()
function changeKeyword(value: string) {
  router.push(`/dashboard/site/${site.siteId}/keywords/${encodeURIComponent(value)}`)
}

const pagesForKeywordFilter = computed(() => [
  contains(query, keyword),
])
</script>

<template>
  <div>
    <USelectMenu class="mb-6" searchable :model-value="keyword" variant="none" :items="[{ label: keyword, value: keyword }]" value-key="value" @update:model-value="changeKeyword">
      <template #item="{ item }">
        <div class="flex w-full items-center">
          <div class="flex items-center gap-2">
            <span class="truncate">{{ item.value }}</span>
          </div>
        </div>
      </template>
      <template #default="{ open }">
        <UButton color="neutral" variant="ghost" size="xl" class="flex items-center gap-1 pl-0">
          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 transition-transform text-gray-400 dark:text-gray-500" :class="[open && 'transform rotate-90']" />
          <h2 class="text-xl font-semibold">
            {{ keyword }}
          </h2>
        </UButton>
      </template>
    </USelectMenu>
    <h2 class="text-lg font-semibold mb-4">
      Google Search Console
    </h2>
    <div class="grid grid-cols-2 w-full gap-10 mb-10">
      <UCard>
        <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
      </UCard>
    </div>
    <UCard>
      <GscdumpPagesTable :site-id="site.gscdumpSiteId" :extra-filters="pagesForKeywordFilter" :page-size="10" />
    </UCard>
  </div>
</template>
