<script setup lang="ts">
import { UiButton } from '#components'
// Provider sign-in/sign-up button list shared by the login + onboarding auth
// panels (and the brand-kit showcase). The first provider renders as the CTA,
// the rest as secondary; a "Last used" label marks the promoted provider.
//
// Pure presentation: labels, hrefs and ordering are computed by the consumer
// (each page builds the source param + copy). This component only renders and
// emits `select` so the consumer can persist the last-used provider.
export interface UiAuthProvider {
  id: string
  label: string
  icon: string
  href?: string
  external?: boolean
  lastUsed?: boolean
  testId?: string
}

const { providers } = defineProps<{ providers: UiAuthProvider[] }>()
const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <div v-for="(p, idx) in providers" :key="p.id" class="relative">
      <UiButton
        :data-testid="p.testId"
        :to="p.href"
        :external="p.external"
        :purpose="idx === 0 ? 'cta' : 'secondary'"
        size="lg"
        :icon="p.icon"
        block
        @click="emit('select', p.id)"
      >
        {{ p.label }}
        <template v-if="p.lastUsed && providers.length > 1" #trailing>
          <span class="absolute right-4 text-[11px] font-medium tracking-wide opacity-60">
            Last used
          </span>
        </template>
      </UiButton>
    </div>
  </div>
</template>
