<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const { data: guides } = await useAsyncData('all-guides', async () => {
  const items = await queryCollection('guides').all()
  return items.slice().sort((a, b) => {
    const ao = (a as any).navigation?.order ?? Number.POSITIVE_INFINITY
    const bo = (b as any).navigation?.order ?? Number.POSITIVE_INFINITY
    return ao - bo
  })
})

useSeoMeta({
  title: 'Google Indexing API Guides',
  description: 'Learn how to use the Google Indexing API with step-by-step tutorials, code examples, and best practices for Node.js, Python, bulk submission, and more.',
})

defineOgImage('Page', {
  headline: 'Guides',
  title: 'Google Indexing API Guides',
  description: 'Tutorials, code examples, and best practices.',
})

useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': 'Google Indexing API Guides',
    'description': 'Learn how to use the Google Indexing API with step-by-step tutorials, code examples, and best practices.',
  }),
])

const iconMap: Record<string, string> = {
  'i-heroicons-book-open': 'i-heroicons-book-open',
  'i-heroicons-academic-cap': 'i-heroicons-academic-cap',
  'i-simple-icons-nodedotjs': 'i-simple-icons-nodedotjs',
  'i-heroicons-arrow-up-tray': 'i-heroicons-arrow-up-tray',
  'i-heroicons-exclamation-triangle': 'i-heroicons-exclamation-triangle',
  'i-heroicons-chart-bar': 'i-heroicons-chart-bar',
}
</script>

<template>
  <div>
    <UPageSection
      headline="Guides"
      title="Google Indexing API Guides"
      description="Everything you need to set up, integrate, and optimize the Google Indexing API. From first API call to production-ready bulk submission."
      :ui="{ container: 'max-w-7xl', title: 'font-title' }"
    >
      <UPageGrid>
        <UPageCard
          v-for="guide in guides"
          :key="guide.path"
          :title="guide.title"
          :description="guide.description"
          :icon="iconMap[guide.icon as string] || 'i-heroicons-document-text'"
          :to="guide.path"
          spotlight
          spotlight-color="primary"
          variant="outline"
        >
          <template v-if="guide.path === '/google-indexing-api'" #badge>
            <UBadge color="primary" variant="subtle" size="sm">
              Start Here
            </UBadge>
          </template>
        </UPageCard>
      </UPageGrid>
    </UPageSection>
  </div>
</template>
