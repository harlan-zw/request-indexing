<script lang="ts" setup>
// Entry point for the Search Console integration grant.
//
// Signing in with Google establishes identity only; it does not grant the
// webmasters scopes, so a freshly signed-in account has no `gscdumpUserId` and
// every panel renders empty. `/auth/integrations/gsc/connect` is the grant flow
// (offline access + refresh token, registered with gscdump in the callback).
// Nothing in the dashboard linked to it, so there was no way to reach it.
const { returnTo = '/dashboard' } = defineProps<{ returnTo?: string }>()
const { session } = useUserSession()

// `gscdumpUserId` alone is not enough: the browser's gscdump proxy also needs
// the stored per-user API key, and accounts registered before that key was
// persisted have one without the other. Keying on the id hid this prompt from
// exactly the users who needed it.
const isConnected = computed(() => Boolean(session.value?.gscdumpConnected))
</script>

<template>
  <div v-if="!isConnected" class="rounded-lg border border-dashed p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-highlighted">
          Connect Google Search Console
        </h2>
        <p class="max-w-xl text-sm text-muted">
          Connecting grants read access to your Search Console properties so your sites,
          indexing status, coverage, and submissions can load.
        </p>
      </div>
      <UButton
        :to="`/auth/integrations/gsc/connect?returnTo=${encodeURIComponent(returnTo)}`"
        external
        icon="i-simple-icons-google"
        label="Connect Search Console"
        class="shrink-0"
      />
    </div>
  </div>
</template>
