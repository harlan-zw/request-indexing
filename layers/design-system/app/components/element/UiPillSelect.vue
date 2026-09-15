<script setup lang="ts" generic="T extends string | number">
const props = defineProps<{
  options: { label: string, value: T }[]
}>()

const modelValue = defineModel<T>({ required: true })
</script>

<template>
  <!-- Solid border, full opacity: the half-opacity rule read as an unfinished
       placeholder and all but vanished on dark surfaces. Pills never wrap
       internally; the row scrolls instead so a chip cannot deform at 390px. -->
  <div class="inline-flex max-w-full items-center gap-0.5 overflow-x-auto p-0.5 rounded-lg bg-elevated border border-default">
    <button
      v-for="opt in props.options"
      :key="opt.value"
      class="shrink-0 whitespace-nowrap px-2.5 py-1 text-xs font-medium rounded-md transition-[background-color,color,box-shadow] duration-200"
      :class="[
        modelValue === opt.value
          ? 'bg-default text-default shadow-sm'
          : 'text-muted hover:text-default',
      ]"
      @click="modelValue = opt.value"
    >
      {{ opt.label }}
    </button>
  </div>
</template>
