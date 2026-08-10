<script setup lang="ts">
const props = defineProps<{
  team: { id: number, name: string, personalTeam: boolean }
  size?: 'xs' | 'sm' | 'md'
}>()

const sizeClass = computed(() => {
  switch (props.size ?? 'sm') {
    case 'xs': return 'size-5 text-[10px]'
    case 'md': return 'size-8 text-sm'
    default: return 'size-6 text-[11px]'
  }
})

const initials = computed(() => {
  const name = props.team.personalTeam ? 'P' : props.team.name
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]!.toUpperCase())
    .join('')
  return letters || '?'
})

const tone = computed(() => {
  if (props.team.personalTeam)
    return 'bg-primary/10 text-primary ring-primary/20'
  // Stable tone derived from team id hash so the same team always gets the same swatch.
  const hash = Array.from(String(props.team.id)).reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const palette = [
    'bg-info/10 text-info ring-info/20',
    'bg-success/10 text-success ring-success/20',
    'bg-warning/10 text-warning ring-warning/20',
    'bg-primary/10 text-primary ring-primary/20',
  ]
  return palette[hash % palette.length]!
})
</script>

<template>
  <span
    class="inline-flex items-center justify-center font-semibold rounded-md ring-1 shrink-0 select-none"
    :class="[sizeClass, tone]"
    :aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>
