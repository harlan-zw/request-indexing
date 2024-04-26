<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any, siteLoader: any, slug: string }>()

definePageMeta({
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket-launch',
})

const siteData = useSiteData(props.site)
const { data: report } = siteData.psiRun()

useHead({
  title: 'PageSpeed Insights',
})
</script>

<template>
  <div>
    <UCard v-if="report?.lighthouseResult">
      <div v-for="category in report?.lighthouseResult.categories" :key="category.id">
        <h2>{{ category.title }}</h2>
        <p>{{ category.score }}</p>
      </div>
    </UCard>
  </div>
</template>
