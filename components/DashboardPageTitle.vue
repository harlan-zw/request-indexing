<script lang="ts" setup>
import { withLeadingSlash } from 'ufo'

defineProps<{
  title: string
  icon: string
  subTitle: string
}>()

const path = useRoute().path
const to = computed(() => {
  // should be the path up to the 4th segment
  const segments = path.split('/').filter(Boolean)
  return withLeadingSlash(segments.slice(0, 4).join('/'))
})
</script>

<template>
  <div class="flex items-center gap-2 ml-4">
    <NuxtLink :to="to" class="text-base flex items-center gap-1" :class="subTitle ? 'text-gray-500' : 'font-semibold text-gray-900'">
      <UIcon v-if="!subTitle" :name="icon" />
      <div>{{ title }}</div>
    </NuxtLink>
    <div v-if="subTitle" class="ml-3 flex items-center gap-1">
      <UIcon :name="icon" />
      {{ subTitle }}
    </div>
  </div>
</template>
