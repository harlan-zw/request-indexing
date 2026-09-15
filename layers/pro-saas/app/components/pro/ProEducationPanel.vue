<script setup lang="ts">
import { ref } from 'vue'
import { UiButton, UiIcon } from '#components'

const { defaultOpen = false } = defineProps<{
  what: string
  why: string
  actions: string[]
  color?: string
  defaultOpen?: boolean
}>()

const open = ref(defaultOpen)
</script>

<template>
  <div class="rounded-lg border border-default overflow-hidden">
    <UiButton
      type="button"
      purpose="quiet"
      intensity="subtle"
      block
      :animated-label="false"
      class="!justify-start !rounded-none gap-2 !px-4 !py-2.5 text-left hover:bg-accented"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UiIcon name="tip" class="size-3.5 text-dimmed shrink-0" />
      <span class="text-xs font-medium flex-1">What is this?</span>
      <UiIcon
        name="expand"
        class="size-3 text-dimmed shrink-0 transition-transform duration-150"
        :class="{ 'rotate-180': open }"
      />
    </UiButton>
    <div v-if="open" class="px-4 pb-4 pt-1 space-y-4 border-t border-default/30">
      <div>
        <p class="text-sm text-muted">
          {{ what }}
        </p>
      </div>
      <div>
        <h3 class="text-xs font-semibold mb-1">
          Why it matters
        </h3>
        <p class="text-sm text-muted">
          {{ why }}
        </p>
      </div>
      <div>
        <h3 class="text-xs font-semibold mb-1.5">
          What to do
        </h3>
        <ul class="space-y-1.5">
          <li v-for="(action, i) in actions" :key="i" class="flex items-start gap-2 text-sm text-muted">
            <UiIcon
              name="check"
              class="size-4 shrink-0 mt-0.5 text-dimmed"
              aria-hidden="true"
            />
            <span>{{ action }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
