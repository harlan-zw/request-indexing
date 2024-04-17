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
    <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
      <p class="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2">
        Google Account <UBadge color="blue" variant="subtle">
          Easy
        </UBadge>
      </p>
      <p class="text-gray-500 dark:text-gray-400 mt-1 mb-3">
        Get up and running in less than a minute using Google.
      </p>
      <UButton to="/auth/google" external color="gray" size="lg" class="flex justify-center">
        <GoogleSvg class="w-4 h-4" />
        <span>Sign in with Google</span>
      </UButton>
      <div title="Required Scopes" class="mt-5">
        <div class="space-y-2">
          <div>userinfo.email - You'll receive opt-out emails for product updates.</div>
          <div>
            <NuxtLink to="/" class="underline">
              Google Search Console API
            </NuxtLink> (read only) - Used to query pages that are indexed.
          </div>
        </div>
      </div>
      <p class="mt-5 ">
        <UIcon name="i-heroicons-shield-check" class="text-blue-500 -mb-[3px] mr-1" />
        <span>You can delete your data and revoke tokens at any time.</span>
      </p>
    </UCard>
    <p class="text-gray-900 text-center text-sm">
      Request Indexing is MIT <NuxtLink to="https://github.com/harlan-zw/request-indexing" target="_blank" class="underline">
        open-source
      </NuxtLink>.
    </p>
  </div>
</template>
