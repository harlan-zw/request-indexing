<script setup>
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

useHead({
  meta: [
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
})

useSeoMeta({
  titleTemplate: '%s %separator Request Indexing',
  ogSiteName: 'Request Indexing',
  ogTitle: 'Tell Google to index your missing pages.',
  twitterTitle: 'Tell Google to index your missing pages.',
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UNotifications />
  </div>
</template>
