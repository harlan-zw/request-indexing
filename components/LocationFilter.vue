<script lang="ts" setup>
import countries from '../server/data/countries'

const allCountries = countries.map(country => ({
  label: country.name,
  value: country['alpha-3'],
  icon: `i-circle-flags-${country['alpha-2'].toLowerCase()}`,
}))
</script>
<template>
<USelectMenu searchable searchable-placeholder="Search a location..." size="xs" :options="allCountries">
  <template #default="{ open }">
  <UButton size="xs" color="gray" icon="i-ph-globe-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid" @click="open">
    All locations
  </UButton>
  </template>
  <template #option="{ option: country }">
  <Icon :name="country.icon" class="w-4 h-4" />
  <span class="truncate">{{ country.label }}</span>
  </template>
</USelectMenu>
</template>
