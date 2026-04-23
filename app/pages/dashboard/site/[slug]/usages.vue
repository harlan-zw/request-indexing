<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Settings',
  subTitle: 'API Usages',
  icon: 'i-heroicons-check-circle',
})

const { data } = await useAsyncData(`usages:${props.site.siteId}`, () =>
  $fetch(`/api/sites/${props.site.siteId}/usages`), { server: false })

function keyToLabel(key: string) {
  switch (key) {
    case 'crux': return 'Chrome User Experience Report'
    case 'googleAds': return 'Google Ads'
    case 'gsc': return 'Google Search Console'
    case 'psi': return 'PageSpeed Insights'
  }
}
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>
    <div class="flex gap-3 mb-3">
      <h2 class="mb-2 flex items-center text-sm font-semibold">
        Property {{ site.property }}
      </h2>
    </div>
    <div class="grid grid-cols-12 gap-7">
      <div class="col-span-9 space-y-10">
        <CardTitle>
          <UIcon name="i-ph-database-duotone" class="w-5 h-5 text-gray-500" />
          API Usages
        </CardTitle>
        <UCard v-if="data" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div class="text-sm mb-4 space-y-7">
            <div v-for="row in data" :key="row.key">
              <ProgressPercent :value="row.usage">
                <div class="text-3xl">
                  {{ row.usage }}<span class="text-lg">/ 100</span>
                </div>
                {{ keyToLabel(row.key) }}
              </ProgressPercent>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
