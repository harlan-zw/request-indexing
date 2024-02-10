<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'dark:bg-gray-950',
  },
})
</script>

<template>
  <div class="min-h-screen py-14 flex items-center justify-center overlay">
    <Gradient />

    <UButton icon="i-heroicons-home" label="Home" to="/" color="white" class="absolute top-4" />

    <slot />
  </div>
</template>
