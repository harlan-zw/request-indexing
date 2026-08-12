<script lang="ts" setup>
// Entry point for the Search Console integration grant.
//
// Signing in with Google establishes identity only; it does not grant the
// webmasters scopes, so a freshly signed-in account has no `gscdumpUserId` and
// every panel renders empty. `/auth/integrations/gsc/connect` is the grant flow
// (offline access + refresh token, registered with gscdump in the callback).
// Nothing in the dashboard linked to it, so there was no way to reach it.
const { session } = useUserSession()

const isConnected = computed(() => Boolean(session.value?.gscdumpUserId))
const returnTo = '/dashboard'
</script>

<template>
  <div v-if="!isConnected" class="rounded-lg border border-dashed p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="space-y-1">
        <h2 class="text-base font-semibold text-highlighted">
          Connect Google Search Console
        </h2>
        <p class="max-w-xl text-sm text-muted">
          Your sites are listed, but there is no Search Console data behind them yet.
          Connecting grants read access to your properties so indexing status,
          coverage, and submissions can load.
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
