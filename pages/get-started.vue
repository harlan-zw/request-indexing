<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

useSeoMeta({
  title: 'Login',
})

const keyLogin = useRuntimeConfig().public.features.keyLogin
</script>

<template>
  <div class="px-5 py-10 flex xl:flex-row flex-col gap-10">
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
      <UAlert title="Required Scopes" class="mt-5">
        <template #description>
          <div class="space-y-2">
            <div>userinfo.email - You may be emailed in the future.</div>
            <div>
              <NuxtLink to="/" class="underline">
                Google Search Console API
              </NuxtLink> (read only) - Used to query pages that are indexed.
            </div>
          </div>
        </template>
      </UAlert>
      <p class="mt-5 ">
        <UIcon name="i-heroicons-shield-check" class="text-blue-500 -mb-[3px] mr-1" />
        <span>You can delete your data and revoke tokens at any time.</span>
      </p>
    </UCard>
    <div class="gap-5 flex flex-col">
      <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
        <p class="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2">
          <UIcon name="i-heroicons-key" />Use Your Keys <UBadge variant="soft" color="gray">
            Hard
          </UBadge>
        </p>
        <p class="text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Get a full API quota by using your own Google API keys.
        </p>
        <div class="mb-5">
          <ul class="ml-7 mb-5 list-disc" />
        </div>
        <UButton :disabled="!keyLogin" color="gray" size="lg" icon="i-heroicons-arrow-up-tray" class="flex w-full justify-center">
          <span>Upload Key</span>
          <UBadge color="yellow" variant="subtle">
            Coming Soon
          </UBadge>
        </UButton>
      </UCard>
      <UCard class="max-w-sm w-full bg-white/75 dark:bg-white/5 backdrop-blur">
        <p class="text-2xl text-gray-900 dark:text-white font-bold flex items-center gap-2">
          <UIcon name="i-heroicons-command-line" /> Run Locally <UBadge variant="soft" color="gray">
            Hard
          </UBadge>
        </p>
        <p class="text-gray-500 dark:text-gray-400 mt-1 mb-3">
          Run this site on your own server for maximum privacy and control.
        </p>
        <UButton to="https://github.com/harlan-zw/request-indexing" icon="i-simple-icons-github" external color="gray" size="lg" class="flex justify-center">
          <span>Visit Documentation</span>
        </UButton>
      </UCard>
    </div>
  </div>
</template>
