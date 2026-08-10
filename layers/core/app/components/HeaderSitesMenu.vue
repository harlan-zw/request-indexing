<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'

const { sites } = defineProps<{
  sites: Array<{ siteId: string, domain: string }>
}>()

const items = computed(() =>
  sites.map(site => ({
    label: withoutTrailingSlash(site.domain.replace('https://', '')),
    icon: 'i-ph-browser-duotone',
    to: `/dashboard/site/${encodeURIComponent(site.siteId)}/overview`,
  })),
)
</script>

<template>
  <div class="mega-menu p-2 min-w-[320px]">
    <div class="mega-column grid grid-cols-2 gap-1" style="--stagger: 0">
      <HeaderMenuItem
        v-for="(item, idx) in items"
        :key="item.to"
        v-bind="item"
        :item-delay="idx"
      />
    </div>
  </div>
</template>
