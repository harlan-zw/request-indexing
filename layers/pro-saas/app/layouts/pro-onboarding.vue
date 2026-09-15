<script setup lang="ts">
// Focused chrome for first-run setup: no sidebar, no dashboard nav, one column.
// The account row is the only way out, so a user who signed in with the wrong
// account is never trapped.
const { session } = useUserSession()
const logout = createLogoutHandler()
const accountLabel = computed(() => session.value?.user?.email ?? session.value?.user?.name ?? 'Account')
</script>

<template>
  <UiWizardShell class="min-h-screen" :show-exit="false">
    <template #logo>
      <NuxtLink to="/" class="inline-flex min-h-11 items-center rounded-md text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <OgBrand :size="26" wordmark semantic />
      </NuxtLink>
    </template>

    <template #account>
      <span class="hidden max-w-[16rem] truncate text-xs text-muted sm:inline">{{ accountLabel }}</span>
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="min-h-11"
        label="Sign out"
        @click="logout()"
      />
    </template>

    <slot />
  </UiWizardShell>
</template>
