<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'
import { contains, page } from 'gscdump/query'

const props = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Pages',
  subTitle: 'Inspect Page',
  icon: 'i-heroicons-folder',
})

const path = useRoute().params.path as string

const router = useRouter()
function changePath(value: string) {
  router.push(`/dashboard/site/${props.site.siteId}/pages/${encodeURIComponent(value)}`)
}

const pageFilter = computed(() => [
  contains(page, path),
])
</script>

<template>
  <div>
    <USelectMenu class="mb-6" searchable :model-value="path" variant="none" :items="[{ label: '/', value: '/' }, { label: path, value: path }]" value-key="value" @update:model-value="changePath">
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
            {{ path }}
          </h2>
        </UButton>
      </template>
    </USelectMenu>
    <div class="grid grid-cols-2 w-full gap-10 mb-10">
      <UCard>
        <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
      </UCard>
    </div>
    <UCard>
      <GscdumpKeywordsTable :site-id="site.gscdumpSiteId" :extra-filters="pageFilter" :page-size="10" />
    </UCard>
  </div>
</template>
