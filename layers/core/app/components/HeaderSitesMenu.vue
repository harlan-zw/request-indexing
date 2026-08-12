<script setup lang="ts">
const { sites } = defineProps<{
  sites: Array<{ siteId: string | number, domain?: string | null, property?: string | null }>
}>()

const items = computed(() =>
  sites.map(site => ({
    label: siteLabel(site),
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
