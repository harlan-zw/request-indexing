<script setup>
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#111827' : 'white')

useHead({
  meta: [
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
})

const entry = useHead({
  link: [
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: `/icons/icon-${colorMode.value === 'system' ? 'dark' : colorMode.value}.svg`,
    },
  ],
})
// switch logos on colorMode
watch(colorMode, () => {
  entry.patch({
    link: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: `/icons/icon-${colorMode.value}.svg`,
      },
    ],
  })
})

useSeoMeta({
  titleTemplate: '%s %separator Request Indexing',
  ogSiteName: 'Request Indexing',
  ogTitle: 'Get your pages indexed within 48 hours.',
  twitterTitle: 'Get your pages indexed within 48 hours.',
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

<style>
pre {
  --scrollbar-thumb: #3b5178;
}

.dark pre {
  --scrollbar-thumb: #acbad2;
}

* {
  --scrollbar-track: initial;
  --scrollbar-thumb: initial;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
  scrollbar-width: thin;
  --scrollbar-thumb: #acbad2;
}

::-webkit-scrollbar-track {
  background-color: var(--scrollbar-track)
}

::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb);
  border-radius: .25rem
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px
}

.dark * {
  --scrollbar-thumb: #3b5178;
}

.page-enter-active,
.page-leave-active {
  transition: all 0.2s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(1rem);
  filter: blur(0.2rem);
}
</style>
