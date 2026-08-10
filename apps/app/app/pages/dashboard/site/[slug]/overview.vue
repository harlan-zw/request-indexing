<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Overview',
  icon: 'i-ph-chart-bar-duotone',
})

const tabItems = [
  { label: 'Most Clicked', icon: 'i-ph-chart-bar-duotone', description: 'Show data by most clicks.' },
  { label: 'Improving', icon: 'i-ph-chart-line-up-duotone', description: 'Clicks improving compared to the previous period.' },
  { label: 'Declining', icon: 'i-ph-chart-line-down-duotone', description: 'Clicks diminishing compared to the previous period.' },
]
const tab = ref(0)
const currentTab = computed(() => tabItems[tab.value])
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <div class="max-w-sm">
          <UPopover :popper="{ placement: 'bottom-end' }">
            <template #default="{ open }">
              <UButton size="xs" color="neutral" :icon="currentTab.icon" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
                <span class="truncate">{{ currentTab.label }}</span>
              </UButton>
            </template>
            <template #panel>
              <div v-for="(item, i) in tabItems" :key="i">
                <UButton size="lg" color="neutral" :icon="item.icon" variant="ghost" :class="[tab === i && 'bg-gray-50 dark:bg-gray-800']" @click="tab = i">
                  <div class="flex flex-col items-start">
                    <div class="truncate">
                      {{ item.label }}
                    </div>
                    <div class="text-xs text-gray-500 max-w-[200px] text-left">
                      {{ item.description }}
                    </div>
                  </div>
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>
    <div class="grid grid-cols-12 gap-7">
      <div class="col-span-9 space-y-7">
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
        </UCard>
        <div>
          <CardTitle>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="hover:underline">
              Pages
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpPagesTable
              :site-id="site.gscdumpSiteId"
              :page-size="5"
              :searchable="false"
              :sortable="false"
              :pagination="false"
              :exclude-columns="['topKeyword']"
            />
          </UCard>
        </div>
        <div>
          <CardTitle>
            <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/keywords`">
              Keywords
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpKeywordsTable
              :site-id="site.gscdumpSiteId"
              :page-size="5"
              :searchable="false"
              :sortable="false"
              :pagination="false"
              :exclude-columns="['topPage', 'searchVolume']"
            />
          </UCard>
        </div>
      </div>
      <div class="col-span-3 space-y-10">
        <div>
          <CardTitle>
            <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/countries`">
              Countries
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpCountriesTable
              :site-id="site.gscdumpSiteId"
              :page-size="5"
              :searchable="false"
              :sortable="false"
              :pagination="false"
              :exclude-columns="['impressions', 'ctr']"
            />
          </UCard>
        </div>
        <div>
          <CardTitle>
            Devices
          </CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpDevicesCard :site-id="site.gscdumpSiteId" />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>
