<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { data: comparisons } = await useAsyncData('all-comparisons', () =>
  queryCollection('comparisons').all())

useSeoMeta({
  title: 'Request Indexing comparisons',
  description: 'How Request Indexing differs from Indexly, SEO Gets, TagParrot, OmegaIndexer, and the rest of the Google indexing tools landscape.',
})

defineOgImage('Page', {
  headline: 'Comparisons',
  title: 'Request Indexing vs the rest',
  description: 'Honest side-by-sides with every major alternative.',
})
</script>

<template>
  <div>
    <UPageSection
      headline="Comparisons"
      title="Request Indexing vs the rest"
      description="Honest side-by-sides with every major alternative — what they do well, where we differ, when to pick which."
      :ui="{ container: 'max-w-7xl', title: 'font-title' }"
    >
      <UPageGrid>
        <UPageCard
          v-for="comparison in comparisons"
          :key="comparison.path"
          :title="comparison.title"
          :description="comparison.description"
          icon="i-heroicons-scale"
          :to="comparison.path"
          spotlight
          spotlight-color="primary"
          variant="outline"
        />
      </UPageGrid>
    </UPageSection>
  </div>
</template>
