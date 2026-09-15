<script setup lang="ts">
// Presentational heading for the auth/onboarding panels (login, onboarding,
// brand-kit showcase). Title + optional description, in the canonical auth
// type scale. Pure presentation — no runtime services.
const { title, description, size = 'lg' } = defineProps<{
  title: string
  description?: string
  size?: 'md' | 'lg'
}>()
</script>

<template>
  <div class="mb-6">
    <h1
      class="font-semibold tracking-tight text-highlighted leading-[1.1] mb-3"
      :class="size === 'lg' ? 'text-3xl' : 'text-2xl'"
    >
      {{ title }}
    </h1>
    <p v-if="description" class="text-muted text-sm leading-relaxed">
      {{ description }}
    </p>
  </div>
</template>
