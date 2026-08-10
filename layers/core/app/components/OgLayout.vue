<script setup lang="ts">
const { padded = true } = defineProps<{
  padded?: boolean
}>()

const VERDANT_BG = [
  'radial-gradient(70% 80% at 85% 0%, rgba(16, 185, 129, 0.18) 0%, transparent 65%)',
  'radial-gradient(55% 70% at 0% 100%, rgba(16, 185, 129, 0.10) 0%, transparent 60%)',
  '#f7f7eb',
].join(', ')
</script>

<template>
  <div
    class="w-full h-full flex flex-col relative overflow-hidden font-sans"
    :style="{ background: VERDANT_BG, color: '#1c1f0e' }"
  >
    <div
      v-if="padded"
      class="flex flex-col w-full h-full"
      style="padding: 64px 80px 140px 80px;"
    >
      <slot />
    </div>
    <slot v-else />

    <div
      class="absolute"
      style="left: -8px; right: -8px; bottom: -60px; height: 80px; background-color: #10b981; transform: rotate(-2deg); opacity: 0.9;"
    />
  </div>
</template>
