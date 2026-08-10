<script setup lang="ts">
const props = withDefaults(defineProps<{
  loading?: boolean
  focused?: boolean
  colorScheme?: 'emerald' | 'blue' | 'amber' | 'cyan' | 'violet'
}>(), {
  colorScheme: 'emerald',
})

const internalFocused = ref(false)
const isFocused = computed(() => props.focused ?? internalFocused.value)

provide('toolInputGlow', {
  onFocus: () => internalFocused.value = true,
  onBlur: () => internalFocused.value = false,
})
</script>

<template>
  <div class="mb-8 max-w-4xl relative">
    <div
      class="absolute -inset-0.5 rounded-xl bg-gradient-to-r opacity-0 blur-sm transition-opacity duration-300"
      :class="[
        {
          'from-emerald-500/50 via-green-500/50 to-teal-500/50': colorScheme === 'emerald',
          'from-blue-500/50 via-cyan-500/50 to-blue-500/50': colorScheme === 'blue',
          'from-amber-500/50 via-orange-500/50 to-yellow-500/50': colorScheme === 'amber',
          'from-cyan-500/50 via-teal-500/50 to-cyan-500/50': colorScheme === 'cyan',
          'from-violet-500/50 via-purple-500/50 to-violet-500/50': colorScheme === 'violet',
        },
        { 'opacity-100': isFocused, 'opacity-30': loading },
      ]"
    />
    <UCard class="relative">
      <slot />
    </UCard>
  </div>
</template>
