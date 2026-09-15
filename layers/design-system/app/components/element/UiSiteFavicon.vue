<script setup lang="ts">
import { UiFavicon } from '#components'

const { domain, tier, size = 16 } = defineProps<{
  domain: string
  /** Product-owned site tier. External identities should use `UiFavicon`. */
  tier: 'growth' | 'monitor'
  size?: number
}>()
</script>

<template>
  <span
    class="inline-grid shrink-0 place-items-center"
    :style="{
      width: `${size + 2}px`,
      height: `${size + 2}px`,
    }"
    :data-monitoring-tier="tier"
    aria-hidden="true"
  >
    <UiFavicon :domain="domain" :size="size" decorative />
  </span>
</template>
