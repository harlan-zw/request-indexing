<script lang="ts" setup>
import {webVitals} from "~/utils/webVitals";

const props = defineProps<{
  value: number
  id: string
}>()

const definition = webVitals[props.id]
</script>
<template>
<UPopover mode="hover" :popper="{ placement: 'left' }" class="min-w-full flex justify-between">
  <slot></slot>
  <template #panel>
  <div class="max-w-sm p-3">
    <div class="text-sm mb-3 text-gray-700" v-html="definition.descriptionHtml" />
    <div class="text-xs">
      <div class="flex items-center gap-2"><div class="bg-green-500 w-3 h-2 rounded-full" />Good: {{ definition.scoreHuman.good }}</div>
      <div class="flex items-center gap-2"><div class="bg-yellow-500 w-3 h-2 rounded-full" />Needs Improvement: {{ definition.scoreHuman.moderate }}</div>
      <div class="flex items-center gap-2"><div class="bg-red-500 w-3 h-2 rounded-full" />Poor: {{ definition.scoreHuman.poor }}</div>
    </div>
  </div>
  </template>
</UPopover>
</template>
