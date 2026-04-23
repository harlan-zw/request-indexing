<script setup lang="ts">
withDefaults(defineProps<{
  colorScheme?: 'emerald' | 'blue' | 'amber' | 'cyan' | 'violet'
}>(), {
  colorScheme: 'emerald',
})
</script>

<template>
  <div class="min-h-screen relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl"
        :class="{
          'bg-gradient-to-br from-emerald-500/8 via-green-500/5 to-transparent': colorScheme === 'emerald',
          'bg-gradient-to-br from-blue-500/8 via-cyan-500/5 to-transparent': colorScheme === 'blue',
          'bg-gradient-to-br from-amber-500/8 via-orange-500/5 to-transparent': colorScheme === 'amber',
          'bg-gradient-to-br from-cyan-500/8 via-blue-500/5 to-transparent': colorScheme === 'cyan',
          'bg-gradient-to-br from-violet-500/8 via-purple-500/5 to-transparent': colorScheme === 'violet',
        }"
      />
      <div
        class="absolute top-1/3 -left-40 w-80 h-80 rounded-full blur-3xl"
        :class="{
          'bg-gradient-to-tr from-teal-500/6 via-emerald-500/4 to-transparent': colorScheme === 'emerald',
          'bg-gradient-to-tr from-cyan-500/6 via-blue-500/4 to-transparent': colorScheme === 'blue',
          'bg-gradient-to-tr from-yellow-500/6 via-amber-500/4 to-transparent': colorScheme === 'amber',
          'bg-gradient-to-tr from-teal-500/6 via-cyan-500/4 to-transparent': colorScheme === 'cyan',
          'bg-gradient-to-tr from-blue-500/6 via-violet-500/4 to-transparent': colorScheme === 'violet',
        }"
      />
    </div>

    <UContainer class="py-12 md:py-20 relative max-w-5xl">
      <slot />
    </UContainer>
  </div>
</template>
