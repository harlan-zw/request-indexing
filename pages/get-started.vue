<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Get Started',
})

const error = useRoute().query.error
</script>

<template>
  <div class="px-5 py-10 flex flex-col gap-4 items-center justify-center">
    <UAlert v-if="error === 'missing-scope'" variant="soft" title="Missing scope." color="yellow" icon="i-heroicons-exclamation-triangle">
      <template #description>
        <div>
          You need to provide access to the Google Search Console API to use Request Indexing. Please try again.
        </div>
      </template>
    </UAlert>
    <div class="flex items-center gap-10">
      <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
        <p class="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2 mb-2">
          Google Account <UBadge color="blue" variant="subtle">
            Easy
          </UBadge>
        </p>
        <p class="mb-3">
          <UIcon name="i-ph-check-fat-duotone" class="text-blue-500 -mb-[3px] mr-1" />
          <span>A personal team will be set up for you with your Google Account details.</span>
        </p>
        <p class="mb-3">
          <UIcon name="i-ph-check-fat-duotone" class="text-blue-500 -mb-[3px] mr-1" />
          <span>Select which Google Search Console sites to sync with your team.</span>
        </p>
        <p class="mb-3">
          <UIcon name="i-ph-shield-check-duotone" class="text-blue-500 -mb-[3px] mr-1" />
          <span>Delete your data and revoke tokens at any time.</span>
        </p>
        <UButton to="/auth/google" external color="gray" size="lg" class="flex justify-center">
          <GoogleSvg class="w-4 h-4" />
          <span>Sign up with Google</span>
        </UButton>
        <div title="Required Scopes" class="mt-5 text-xs">
          <div class="space-y-2">
            <div>
              <NuxtLink to="/" class="underline">
                Google Profile
              </NuxtLink> - Used to setup your personal team.
            </div>
            <div>
              <NuxtLink to="/" class="underline">
                Google Search Console API
              </NuxtLink> (read only) - Used to query your data.
            </div>
          </div>
        </div>
      </UCard>
      <div>
        <UCard class="max-w-sm w-full bg-white/50 dark:bg-white/5 backdrop-blur">
          <p class="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2">
            Run Locally <UBadge color="yellow" variant="subtle">
              Hard
            </UBadge>
          </p>
          <p class="text-gray-500 dark:text-gray-400 mt-1 mb-3">
            You can run Request Indexing on your own machine, it's MIT <NuxtLink to="https://github.com/harlan-zw/request-indexing" target="_blank" class="underline">
              open-source
            </NuxtLink>.
          </p>
          <UButton to="/auth/google" external color="gray" size="lg" class="flex justify-center">
            <span>Clone the repo</span>
          </UButton>
        </UCard>
      </div>
    </div>
  </div>
</template>
