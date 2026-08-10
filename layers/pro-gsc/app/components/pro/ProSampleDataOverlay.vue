<script setup lang="ts">
defineProps<{
  message?: string
  description?: string
  ctaLabel?: string
  ctaTo?: string
}>()
</script>

<template>
  <div class="relative">
    <!-- Faded sample content -->
    <div class="opacity-30 pointer-events-none select-none" aria-hidden="true">
      <slot />
    </div>

    <!-- Overlay -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <div class="text-center px-4">
        <div class="inline-flex items-center justify-center size-10 rounded-xl bg-elevated border border-default mb-3">
          <UIcon name="i-simple-icons-google" class="size-5 text-dimmed" />
        </div>
        <p class="text-sm font-medium text-default mb-1">
          {{ message || 'Preview' }}
        </p>
        <p class="text-[13px] text-muted mb-4">
          {{ description || 'Connect Google Search Console to see your real data.' }}
        </p>
        <UiMotionButton
          v-if="ctaTo"
          :to="ctaTo"
          size="sm"
          color="primary"
          variant="soft"
          icon="i-lucide-plug"
        >
          {{ ctaLabel || 'Connect GSC' }}
        </UiMotionButton>
      </div>
    </div>
  </div>
</template>
