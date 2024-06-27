<script setup lang="ts">
export interface GraphButton {
  key: string
  label: string
  color: string
  value: string | number
}

const props = defineProps<{
  modelValue: string[]
  buttons: GraphButton[]
}>()

const emit = defineEmits<{
  'update:model-value': [key: string]
}>()

// tailwind safelist
// border-b-blue-500
// border-b-blue-300
// border-b-purple-500
// border-b-purple-300
// border-b-orange-500
// border-b-orange-300
// border-b-green-300
// border-b-green-500
// hover:border-b-blue-500
// hover:border-b-purple-500
// hover:border-b-orange-500
// hover:border-b-green-500
// text-blue-500
// text-purple-500
// text-orange-500
// text-green-500

function selectButton(tab) {
  const val = props.modelValue.includes(tab.key)
    ? props.modelValue.filter(v => v !== tab.key)
    : [...props.modelValue, tab.key]
  emit('update:model-value', val)
}
</script>

<template>
  <div class="flex gap-2">
    <button v-for="(tab, key) in buttons" :key="key" type="button" class="w-[80px] transition group border-b-2" :class="[`hover:border-b-${tab.color}-500`, modelValue.includes(tab.key) ? `border-b-${tab.color}-300` : 'border-b-transparent']" @click="selectButton(tab)">
      <div class="text-xs flex items-center gap-1">
        <slot :name="`${tab.key}-icon`">
          <UIcon :name="tab.icon" class="w-4 h-4 opacity-80" :class="`text-${tab.color}-500`" />
        </slot>
        <div class="text-gray-500/80">
          {{ tab.label }}
        </div>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-xl text-gray-800 dark:text-blue-300 font-mono">
          <slot :name="`${tab.key}-value`">
            {{ useHumanFriendlyNumber(tab.value) }}
          </slot>
        </span>
        <slot :name="`${tab.key}-trend`" />
      </div>
    </button>
  </div>
</template>
