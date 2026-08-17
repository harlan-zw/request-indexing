<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'
import { contains, page } from 'gscdump/query'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Pages',
  subTitle: 'Inspect Page',
  icon: 'i-heroicons-folder',
  // PD2: the shell reads its title from route meta, which is static. Fill in
  // the page being inspected before the layout renders, so the header names it
  // on the server and on every client navigation.
  middleware: (to) => {
    const raw = String(to.params.path ?? '')
    to.meta.subTitle = raw.replace(/^https?:\/\/[^/]+/, '') || 'Inspect Page'
  },
})

const raw = useRoute().params.path as string

// Search Console reports pages as absolute URLs, the router carries them as a
// path. Filter on the path so the same value matches either shape.
const pathname = computed(() => raw.replace(/^https?:\/\/[^/]+/, '') || raw)

// PD3: `extra-filters` narrows the site-wide keyword table to this page.
const pageFilter = computed(() => [
  contains(page, pathname.value),
])
</script>

<template>
  <div class="space-y-7">
    <div>
      <UButton
        :to="`/dashboard/site/${site.siteId}/pages`"
        icon="i-heroicons-arrow-left-20-solid"
        color="neutral"
        variant="link"
        size="xs"
        class="-ml-1 mb-1"
      >
        All pages
      </UButton>
      <!-- PD5/PD6: this used to be a two-item select menu. It rendered a stray
           chevron before the heading and a second unlabelled chevron on the far
           right edge, and it could only ever pick between "/" and the page you
           were already on. -->
      <h1 class="text-xl font-semibold break-all">
        {{ pathname }}
      </h1>
      <div class="mt-2">
        <CalenderFilter />
      </div>
    </div>
    <!-- PD4: one card in a two-column grid left the stat card half as wide as
         the table under it. -->
    <UCard>
      <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    </UCard>
    <div>
      <CardTitle>Keywords for this page</CardTitle>
      <UCard>
        <div class="overflow-x-auto">
          <GscdumpKeywordsTable
            class="min-w-[44rem] md:min-w-0"
            :gscdump-site-id="site.gscdumpSiteId"
            :route-slug="String(site.siteId)"
            :extra-filters="pageFilter"
            :page-size="10"
            :exclude-columns="['topPage', 'searchVolume']"
          />
        </div>
      </UCard>
    </div>
  </div>
</template>
