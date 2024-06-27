<script lang="ts" setup>
const dropdownItems = [
  { label: 'Edit', icon: 'i-ph-pencil' },
  { label: 'Delete', icon: 'i-ph-trash' },
]
</script>

<template>
  <div class="flex items-center mb-3 gap-3">
    <div class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
      <slot />
    </div>
    <UDropdown :items="dropdownItems" :popper="{ offsetDistance: 0, placement: 'right-start' }">
      <UIcon name="i-ph-dots-three" class="text-black text-xl" />
    </UDropdown>
  </div>
</template>
