<script lang="ts" setup>
import ProTableCountries from '#layers/pro-gsc/app/internal/components/pro/ProTableCountries.vue'

definePageMeta({ proTab: { feature: 'search-console', label: 'Countries', icon: 'i-lucide-globe', order: 30 } })

const { siteStatus, gscdumpSiteId } = useSite('Countries')
const { period } = useSitePeriod()
</script>

<template>
  <UiAlert
    v-if="siteStatus === 'error'"
    status="error"
    title="Failed to load site data."
  >
    <template #action>
      <UButton size="xs" color="neutral" variant="subtle" to="/pro/dashboard">
        Back to Sites
      </UButton>
    </template>
  </UiAlert>

  <ProPageZone v-else tier="primary" first>
    <ProSectionHeader
      title="Countries"
      icon="i-lucide-globe"
      tooltip="Where your search traffic comes from, based on the searcher's location."
    />
    <ProTableCountries
      :gscdump-site-id="gscdumpSiteId"
      :period="period"
      :page-size="25"
    />
  </ProPageZone>
</template>
