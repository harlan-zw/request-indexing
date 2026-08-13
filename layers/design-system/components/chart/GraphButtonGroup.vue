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
  'update:modelValue': [value: string[]]
}>()

const colorClasses = {
  blue: { active: 'border-b-blue-500', icon: 'text-blue-500' },
  purple: { active: 'border-b-purple-500', icon: 'text-purple-500' },
  orange: { active: 'border-b-orange-500', icon: 'text-orange-500' },
  green: { active: 'border-b-emerald-500', icon: 'text-emerald-500' },
} as const

function getColorClasses(color: string) {
  return colorClasses[color as keyof typeof colorClasses] ?? colorClasses.blue
}

function selectButton(tab: GraphButton) {
  const val = props.modelValue.includes(tab.key)
    ? props.modelValue.filter(v => v !== tab.key)
    : [...props.modelValue, tab.key]
  emit('update:modelValue', val)
}
</script>

<template>
  <div class="grid grid-cols-2 gap-1 sm:flex sm:gap-2">
    <button
      v-for="tab in buttons"
      :key="tab.key"
      type="button"
      class="group min-h-11 min-w-0 border-b-2 px-1 text-left transition-colors sm:w-28"
      :class="modelValue.includes(tab.key) ? getColorClasses(tab.color).active : 'border-b-transparent hover:border-b-default'"
      :aria-label="`Toggle ${tab.label} chart`"
      :aria-pressed="modelValue.includes(tab.key)"
      @click="selectButton(tab)"
    >
      <div class="flex items-center gap-1 text-sm">
        <slot :name="`${tab.key}-icon`">
          <span class="size-4" :class="getColorClasses(tab.color).icon" />
        </slot>
        <div class="truncate text-muted">
          {{ tab.label }}
        </div>
      </div>
      <div class="flex min-w-0 items-center gap-1">
        <span class="shrink-0 font-mono text-lg text-highlighted tabular-nums">
          <slot :name="`${tab.key}-value`">
            {{ useHumanFriendlyNumber(tab.value) }}
          </slot>
        </span>
        <slot :name="`${tab.key}-trend`" />
      </div>
    </button>
  </div>
</template>
