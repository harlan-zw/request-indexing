<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'
import { contains, query } from 'gscdump/query'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Keywords',
  subTitle: 'Keyword',
  icon: 'i-heroicons-magnifying-glass-circle',
  // KD3: the shell reads its title from route meta, which is static. Fill in
  // the keyword before the layout renders, so the header names it on the
  // server and on every client navigation.
  middleware: (to) => {
    to.meta.subTitle = String(to.params.keyword ?? '') || 'Keyword'
  },
})

const keyword = useRoute().params.keyword as string

// KD4: `extra-filters` narrows the site-wide page table to this keyword.
const pagesForKeywordFilter = computed(() => [
  contains(query, keyword),
])
</script>

<template>
  <div class="space-y-7">
    <div>
      <UButton
        :to="`/dashboard/site/${site.siteId}/keywords`"
        icon="i-heroicons-arrow-left-20-solid"
        color="neutral"
        variant="link"
        size="xs"
        class="-ml-1 mb-1"
      >
        All keywords
      </UButton>
      <!-- The select menu that used to sit here held exactly one item, the
           keyword you were already on, and rendered two unlabelled chevrons. -->
      <h1 class="text-xl font-semibold break-words">
        {{ keyword }}
      </h1>
      <div class="mt-2">
        <CalenderFilter />
      </div>
    </div>
    <UCard>
      <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    </UCard>
    <div>
      <CardTitle>Pages ranking for this keyword</CardTitle>
      <UCard>
        <div class="overflow-x-auto">
          <GscdumpPagesTable
            class="min-w-[44rem] md:min-w-0"
            :gscdump-site-id="site.gscdumpSiteId"
            :route-slug="String(site.siteId)"
            :extra-filters="pagesForKeywordFilter"
            :page-size="10"
            :exclude-columns="['topKeyword']"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>
