<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Pages',
  subTitle: 'Inspect Page',
  icon: 'i-heroicons-folder',
})

const path = useRoute().params.path as string

const router = useRouter()
function changePath(value: any) {
  router.push(`/dashboard/site/${props.site.siteId}/pages/${encodeURIComponent(value.value || value)}`)
}

const pageFilter = computed(() => [
  { type: 'contains', column: 'page', value: path },
])
</script>

<template>
  <div>
    <USelectMenu class="mb-6" searchable :model-value="path" variant="none" :options="[{ label: '/', value: '/' }, { label: path, value: path }]" @change="changePath">
      <template #option="{ option }">
        <div class="flex w-full items-center">
          <div class="flex items-center gap-2">
            <span class="truncate">{{ option.value }}</span>
          </div>
        </div>
      </template>
      <template #default="{ open }">
        <UButton color="neutral" variant="ghost" size="xl" class="flex items-center gap-1" :ui="{ padding: { xl: 'pl-0 ' } }">
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
