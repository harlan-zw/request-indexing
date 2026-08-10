<script setup lang="ts">
const props = defineProps<{
  icon: string
  iconColor?: string
  title: string
  description?: string
}>()

const iconClasses = computed(() => getIconColor(props.iconColor || 'neutral'))
</script>

<template>
  <div class="flex items-start gap-3">
    <div
      class="flex items-center justify-center size-10 rounded-2xl shrink-0"
      :class="iconClasses.bg"
    >
      <UIcon
        :name="icon"
        class="size-5"
        :class="iconClasses.text"
      />
    </div>
    <div class="flex-1 min-w-0">
      <p class="font-medium">
        {{ title }}
      </p>
      <p v-if="description" class="text-sm text-muted">
        {{ description }}
      </p>
      <slot />
    </div>
    <slot name="trailing" />
  </div>
</template>
