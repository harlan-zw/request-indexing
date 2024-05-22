<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any, siteLoader: any, slug: string }>()

definePageMeta({
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket-launch',
})

const siteData = useSiteData(props.site)
const { data: report } = siteData.psiDates()

useHead({
  title: 'PageSpeed Insights',
})
</script>

<template>
  <div>
    <UCard>
      {{ report }}
    </UCard>
  </div>
</template>
