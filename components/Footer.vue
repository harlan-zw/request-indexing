<script setup lang="ts">
const toast = useToast()
const links = [
  {
    label: 'Request Indexing',
    children: [
      {
        label: 'Get Started',
        to: '/get-started',
      },
    ],
  },
  {
    label: 'Resources',
    children: [
      {
        label: 'Docs',
        to: 'https://github.com/harlan-zw/request-indexing',
        target: '_blank',
      },
      {
        label: 'Privacy',
        to: '/privacy',
      },
      {
        label: 'Terms',
        to: '/terms',
      },
    ],
  },
  {
    label: 'Project',
    children: [
      {
        label: 'Report a bug',
        to: 'https://github.com/harlan-zw/request-indexing/issues/new?assignees=&labels=pending+triage&projects=&template=bug_report.yml',
        target: '_blank',
      },
      {
        label: 'Roadmap',
        to: 'https://github.com/harlan-zw/request-indexing/issues?q=is%3Aopen+label%3Aenhancement+sort%3Aupdated-desc',
        target: '_blank',
      },
      {
        label: 'Changelog',
        to: 'https://github.com/harlan-zw/request-indexing/releases',
        target: '_blank',
      },
    ],
  },
]

interface JSConfettiApi {
  addConfetti: (options?: { emojis: string[] }) => void
}
declare global {
  interface Window {
    JSConfetti: { new (): JSConfettiApi }
  }
}
function toaster() {
  const $script = useScript<JSConfettiApi>({
    key: 'confetti',
    src: 'https://cdn.jsdelivr.net/npm/js-confetti@latest/dist/js-confetti.browser.js',
  }, {
    skipEarlyConnections: true,
    use() {
      return new window.JSConfetti()
    },
  })
  $script.addConfetti({ emojis: ['🍞'] })
  toast.add({
    title: 'So you like easters eggs? 🥚',
    description: 'How about some bread? 🍞',
  })
}
</script>

<template>
  <UFooter>
    <template #top>
      <UFooterColumns :links="links">
        <template #right>
          <UCard class=" p-5">
            <div>
              <div class="mb-2">
                Hey <Icon name="noto:waving-hand" /> My name is <a href="https://harlanzw.com" target="_blank" class="underline">Harlan</a> <img alt="Harlan Wilton" loading="lazy" src="https://avatars.githubusercontent.com/u/5326365?v=4" class="inline rounded-full w-5 h-5">, I'm the creator of Request Indexing.
              </div>
              <div>
                Do you like this tool? Need a hand? Get in <a href="https://twitter.com/harlan_zw" class="underline">touch</a> with me.
              </div>
            </div>
          </UCard>
        </template>
      </UFooterColumns>
    </template>

    <template #left>
      <p class="text-gray-500 dark:text-gray-400 text-sm mr-5">
        Copyright © {{ new Date().getFullYear() }}. All rights reserved.
      </p>
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Credits for the idea to <a href="https://seogets.com/" target="_blank" class="underline">SEO Gets</a>.
      </p>
    </template>

    <template #right>
      <UButton color="gray" title="Bread" variant="link" target="_blank" class="group" @click="toaster">
        <div class="hidden group-hover:block h-0">
          <Icon name="noto:bread" class="text-xl  " />
        </div>
      </UButton>

      <UColorModeButton size="sm" />

      <UButton color="gray" title="Twitter" variant="link" to="https://twitter.com/harlan_zw" target="_blank">
        <UIcon name="i-simple-icons-twitter" class="text-xl" />
      </UButton>
      <UButton color="gray" title="GitHub" aria-label="GitHub" variant="link" to="https://github.com/harlan-zw/request-indexing" target="_blank">
        <UIcon name="i-simple-icons-github" class="text-xl" />
      </UButton>
      <UButton color="gray" title="Discord" aria-label="Discord" variant="link" to="https://discord.gg/275MBUBvgP" target="_blank">
        <UIcon name="i-simple-icons-discord" class="text-xl" />
      </UButton>
    </template>
  </UFooter>
</template>
