<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Pages',
  subTitle: 'Inspect Page',
  icon: 'i-heroicons-folder',
})

const path = useRoute().params.path

const res = ref()
onMounted(async () => {
  res.value = await $fetch(`/api/sites/${props.site.siteId}/pages/${encodeURIComponent(path as string)}`)
})

const siteData = useSiteData(props.site)
const { data: dates } = siteData.pathDateAnalytics({
  query: {
    filter: `path:${path}`,
  },
})

const router = useRouter()
function changePath(value: string) {
  router.push(`/dashboard/site/${props.site.siteId}/pages/${encodeURIComponent(value.value)}`)
}
</script>

<template>
  <div>
    <USelectMenu class="mb-6" searchable :model-value="path" variant="none" :options="[{ label: '/', value: '/' }, { label: path, value: path }]" @change="changePath">
      <template #option="{ option }">
        <div class="flex w-full items-center">
          <div class="flex items-center gap-2">
            <span class="truncate">{{ useFriendlySiteUrl(option.value) }}</span>
          </div>
        </div>
      </template>
      <template #default="{ open }">
        <UButton color="white" variant="ghost" size="xl" class="flex items-center gap-1" :ui="{ padding: { xl: 'pl-0 ' } }">
          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 transition-transform text-gray-400 dark:text-gray-500" :class="[open && 'transform rotate-90']" />
          <h2 class="text-xl font-semibold">
            {{ path }}
          </h2>
        </UButton>
      </template>
    </USelectMenu>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <CardGoogleSearchConsole v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard>
        <CardKeywords v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard />
    </div>
    <UCard>
      <TablePageKeywordsNext :site="site" :filter="`path:${path}`" />
    </UCard>
  </div>
</template>
