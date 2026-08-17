<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{ error: NuxtError }>()

interface ErrorCopy {
  title: string
  message: string
}

// The raw status message and the failed request line are machine detail. They
// are logged, never rendered, so every status maps to one human sentence.
function describeError(status: number): ErrorCopy {
  if (status === 401) {
    return {
      title: 'Please sign in',
      message: 'Your session ended. Sign in again to open this page.',
    }
  }
  if (status === 403) {
    return {
      title: 'You do not have access',
      message: 'Your account cannot open this page. Ask a team owner to grant access.',
    }
  }
  if (status === 404) {
    return {
      title: 'Page not found',
      message: 'This page does not exist, or it moved to a new address.',
    }
  }
  if (status >= 500) {
    return {
      title: 'Something went wrong',
      message: 'The server could not complete the request. Try again in a moment.',
    }
  }
  return {
    title: 'Something went wrong',
    message: 'We could not load this page. Try again in a moment.',
  }
}

const status = computed(() => Number(error.statusCode) || 500)
const copy = computed(() => describeError(status.value))

const { loggedIn } = useUserSession()

const primaryAction = computed(() => {
  if (loggedIn.value)
    return { label: 'Back to dashboard', to: '/dashboard' }
  if (status.value === 401 || status.value === 403)
    return { label: 'Sign in', to: '/get-started' }
  return { label: 'Back to home', to: '/' }
})

// Keep the machine detail out of the UI but not out of the record.
if (import.meta.client) {
  console.error('[error page]', status.value, error.statusMessage, error.message)
}

useSeoMeta({
  title: () => copy.value.title,
  description: () => copy.value.message,
  robots: 'noindex, nofollow',
})

useHead({
  htmlAttrs: {
    lang: 'en',
  },
})
</script>

<template>
  <UApp>
    <div class="flex min-h-dvh flex-col bg-default">
      <!-- A signed-in user hitting an error stays in the app context: no
           marketing navigation, no footer, no creator card. -->
      <Header v-if="!loggedIn" />
      <div v-else class="border-b border-default">
        <div class="dashboard-container flex min-h-16 items-center">
          <NuxtLink to="/dashboard" class="inline-flex items-center rounded-md text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            <OgBrand :size="26" wordmark semantic />
          </NuxtLink>
        </div>
      </div>

      <main class="flex flex-1 items-center justify-center px-4 py-16">
        <div class="w-full max-w-md text-center">
          <p class="mb-2 font-mono text-sm text-muted">
            {{ status }}
          </p>
          <h1 class="mb-3 font-title text-2xl font-semibold tracking-tight text-highlighted">
            {{ copy.title }}
          </h1>
          <p class="mb-6 text-muted">
            {{ copy.message }}
          </p>
          <UButton @click="clearError({ redirect: primaryAction.to })">
            {{ primaryAction.label }}
          </UButton>
        </div>
      </main>

      <Footer v-if="!loggedIn" />
    </div>
  </UApp>
</template>
