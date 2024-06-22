<script setup lang="ts">
import { VisSingleContainer, VisTopoJSONMap } from '@unovis/vue'
import { WorldMapTopoJSON } from '@unovis/ts/maps'
import { MapProjection } from '@unovis/ts'
import type { SiteSelect } from '~/server/database/schema'

defineProps<{ site: SiteSelect }>()
// const data: MapData = {
//   areas: ['AU','BR','CN','EG','FR','IN','JP','MX','NO','PE','PH','RU','TZ','US']
// }
definePageMeta({
  title: 'Country',
  subTitle: 'Map',
  icon: 'i-ph-globe-hemisphere-east-duotone',
})

const connector = ref()
provide('tableAsyncDataProvider', connector)

const data = computed(() => ({
  areas:
    connector.value?.rows.map((row: any) => {
      // we need to compute a color for the country code, we can use the "percent" value
      // we want a nice blue color that looks like it would belong on a graph, similar to text-blue-500 from tailwind
      // change brightness based on percent with 25% being the darkest and 0% being the lightest
      // we can use the hue-rotate filter to change the color of the country
      return {
        id: row.countryCode,
        color: `hsl(207, 100%, ${100 - row.percent * 5}%)`,
      }
    }),
}))
</script>

<template>
  <div class="space-y-7">
    <div>
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>
    <div>
      <VisSingleContainer :data="data" height="500" class="border border-gray-100 rounded">
        <VisTopoJSONMap
          :projection="MapProjection.Mercator()"
          :topojson="WorldMapTopoJSON"
        />
      </VisSingleContainer>
      <TableCountries :site="site" :page-size="12" :pagination="true" />
    </div>
  </div>
</template>
