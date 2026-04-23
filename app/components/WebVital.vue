<script lang="ts" setup>
import { webVitals } from '~/utils/webVitals'

const props = defineProps<{
  value: number
  id: string
  graph: { time: string, value: number }[]
}>()

const definition = webVitals[props.id]
</script>

<template>
  <div>
    <div class="flex items-center mb-2 justify-between">
      <PopoverWebVital :id="id" :value="value">
        <div class="flex min-w-full justify-between items-center">
          <div class="text-xs font-bold">
            {{ definition.name }}
          </div>
          <div>
            <PsiUnit :value="value" :unitless="id === 'cumulative-layout-shift'" />
            <PsiBenchmark :value="value" :fast="definition.score.good" :moderate="definition.score.moderate" />
          </div>
        </div>
      </PopoverWebVital>
    </div>
    <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
      <GraphWebVital
        :value="graph"
        :fast="definition.score.good"
        :moderate="definition.score.moderate"
      />
    </UCard>
  </div>
</template>
