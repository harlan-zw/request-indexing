<script setup lang="ts">
import DefaultLayout from './default.vue'

const user = useAuthenticatedUser()

const links = [
  { label: 'Profile', to: '/account', icon: 'i-heroicons-user-circle' },
  { label: 'Upgrade', to: '/account/upgrade', icon: 'i-heroicons-star' },
]

const supportLinks = computed(() => [
  {
    icon: 'i-ph-envelope-open-duotone',
    label: 'Email',
    to: 'mailto:harlan@harlanzw.com',
    target: '_blank',
  },
  {
    icon: 'i-ph-chat-centered-text-duotone',
    label: 'Discord',
    to: 'https://discord.gg/275MBUBvgP',
    target: '_blank',
  },
  {
    icon: 'i-ph-github-logo',
    label: 'Submit a bug',
    to: `https://github.com/harlan-zw/request-indexing/issues/new/choose`,
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
            <UPageLinks title="Get Help" :links="supportLinks" class="mb-7" />
            <div>
              <div class="mb-1">
                User ID
              </div>
              <div class="text-gray-400 text-xs mb-1">
                When reporting issues please provide your ID.
              </div>
              <div class="font-mono text-gray-500 text-sm bg-gray-50 px-2 py-1 rounded">
                <code>{{ user.userId }}</code>
              </div>
            </div>
          </UAside>
        </template>
      </UPage>
    </UContainer>
  </DefaultLayout>
</template>
