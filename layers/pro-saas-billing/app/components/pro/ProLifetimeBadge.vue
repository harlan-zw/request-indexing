<script setup lang="ts">
// Visible only on the user's own /account page per UX P2.12.
// Public/shared surfaces never render this.
</script>

<template>
  <div
    class="inline-flex items-center gap-2 rounded-md border border-default bg-muted px-3 py-1.5 text-[13px] text-muted"
  >
    <UIcon name="i-lucide-check-circle-2" class="size-3.5 text-dimmed" aria-hidden="true" />
    <span class="font-medium text-default">Lifetime license</span>
    <span class="text-dimmed" aria-hidden="true">·</span>
    <span>Agency-tier features</span>
    <span class="text-dimmed" aria-hidden="true">·</span>
    <span>forever</span>
  </div>
</template>
