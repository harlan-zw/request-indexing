<script setup lang="ts">
import DefaultLayout from './default.vue'

const links = [
  { label: 'Profile', to: '/account', icon: 'i-heroicons-user-circle' },
  { label: 'Upgrade', to: '/account/upgrade', icon: 'i-heroicons-star' },
]

const repoLinks = computed(() => [
  {
    icon: 'i-ph-github-logo',
    label: 'Submit a bug',
    to: `https://github.com/harlan-zw/request-indexing/issues/new/choose`,
    target: '_blank',
  },
  {
    icon: 'i-ph-github-logo',
    label: 'Request a feature',
    to: `https://github.com/harlan-zw/request-indexing/issues/new/choose`,
    target: '_blank',
  },
])
const supportLinks = computed(() => [
  {
    icon: 'i-ph-chat-centered-text-duotone',
    label: 'Discord Support',
    to: 'https://discord.gg/275MBUBvgP',
    target: '_blank',
  },
  {
    icon: 'i-ph-hand-heart-duotone',
    label: 'Become a Sponsor',
    to: 'https://github.com/sponsors/harlan-zw',
    target: '_blank',
  },
])
</script>

<template>
  <DefaultLayout>
    <UContainer>
      <UPage>
        <template #left>
          <UAside>
            <UNavigationTree title="test" :links="links" />
          </UAside>
        </template>
        <slot />
        <template #right>
          <UAside>
            <UPageLinks title="Get Help" :links="supportLinks" />
            <UDivider dashed />
            <UPageLinks title="Repo" :links="repoLinks" />
          </UAside>
        </template>
      </UPage>
    </UContainer>
  </DefaultLayout>
</template>
