<script setup lang="ts">
import { useScript } from '@unhead/vue'

const confetti = useScript<JSConfettiApi>({
  key: 'confetti',
  src: 'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js',
}, {
  use() {
    return new window.JSConfetti()
  },
})

interface JSConfettiApi {
  addConfetti: (options?: { emojis: string[] }) => void
}
declare global {
  interface Window {
    JSConfetti: { new (): JSConfettiApi }
  }
}

const toast = useToast()
const links = [{
  label: 'Resources',
  children: [{
    label: 'Help center',
  }, {
    label: 'Docs',
  }, {
    label: 'Roadmap',
  }, {
    label: 'Changelog',
  }],
}, {
  label: 'Built With',
  children: [
    {
      label: 'Nuxt SEO',
    },
    {
      label: 'Nuxt UI Pro',
    },
    {
      label: 'Nuxt Auth Utils',
    },
  ],
}, {
  label: 'Credits',
  children: [
    {
      label: 'SEO Gets',
      to: 'https://seogets.com/',
    },
    {
      label: 'Toast',
      click() {
        confetti.addConfetti({ emojis: ['🍞'] })
        toast.add({
          title: '🍞 Surprise! 🍞',
          description: '🍞 Here\'s some toast (or bread). 🍞',
        })
      },
    },
  ],
}]
</script>

<template>
  <UFooter>
    <template #top>
      <UFooterColumns :links="links">
        <template #right>
          <div class="bg-gray-50 dark:bg-gray-800 flex rounded-xl shadow p-5">
            <div>
              <div class="mb-2">
                Hey <Icon name="noto:waving-hand" /> My name is <a href="https://harlanzw.com" target="_blank" class="underline">Harlan</a> and I'm the creator of Request Indexing.
              </div>
              <div>
                Do you like this tool? I'd love to <a href="https://twitter.com/harlan_zw" class="underline">chat</a> with you!
              </div>
            </div>
            <div class="gap-3">
              <img alt="Harlan Wilton" loading="lazy" src="https://avatars.githubusercontent.com/u/5326365?v=4" class="mx-auto rounded-full w-10 h-10 mb-3">
              <div class="flex justify-center items-center opacity-70">
                <UButton color="white" title="Twitter" variant="ghost" to="https://twitter.com/harlan_zw" target="_blank">
                  <UIcon name="i-simple-icons-twitter" class="text-xl" />
                </UButton>
                <UButton color="white" title="GitHub" aria-label="GitHub" variant="ghost" to="https://github.com/harlan-zw" target="_blank">
                  <UIcon name="i-simple-icons-github" class="text-xl" />
                </UButton>
              </div>
            </div>
          </div>
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>
    </template>

    <template #right>
      <UColorModeButton size="sm" />

      <UButton to="https://github.com/nuxt-ui-pro/saas" target="_blank" icon="i-simple-icons-github" aria-label="GitHub" color="gray" variant="ghost" />
    </template>
  </UFooter>
</template>
