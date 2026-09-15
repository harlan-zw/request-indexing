<script setup lang="ts">
</script>

<template>
  <div class="relative overflow-y-auto">
    <div
      aria-hidden="true"
      class="sticky top-0 z-[5] h-5 -mb-5 pointer-events-none bg-gradient-to-b from-default to-transparent [overflow-anchor:none]"
    />
    <slot />
    <div
      aria-hidden="true"
      class="sticky bottom-0 z-[5] h-5 -mt-5 pointer-events-none bg-gradient-to-t from-default to-transparent [overflow-anchor:none]"
    />
  </div>
</template>
