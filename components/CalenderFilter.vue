<script lang="ts" setup>
// use user.analyticsPeriod
import type { UserSelect } from '~/server/database/schema'
import { fetchSites } from '~/composables/fetch'

const { user, fetch } = useUserSession()

const startDate = computed(() => {
  if (!user.value?.analyticsPeriod)
    return new Date(0)

  const period = user.value?.analyticsPeriod
  const date = new Date()
  if (period === 'all')
    return new Date(0)

  if (period.endsWith('d'))
    date.setDate(date.getDate() - Number.parseInt(period.replace('d', '')))
  else
    date.setMonth(date.getMonth() - Number.parseInt(period.replace('m', '')))
  return date.getTime()
})

const datePickerPeriod = ref(user.value?.analyticsRange || {
  start: startDate.value,
  end: new Date().setDate(new Date().getDate() - 1),
})

async function updateAnalyticsPeriod(newPeriod: UserSelect['analyticsPeriod']) {
  await $fetch('/api/user/me', {
    method: 'POST',
    body: {
      analyticsRange: '',
      analyticsPeriod: newPeriod,
    },
  })
  await fetch()
  // refreshes sites
  await fetchSites()
  // refresh all sites
  // if (currentRoute.path === '/dashboard') {
  //   for (const site of sites.data.value?.sites || []) {
  //     const res = await fetchSite(site)
  //     await res.forceRefresh()
  //   }
  // }
  // else if (currentRoute.name === 'dashboard-site-slug') {
  //   const res = await fetchSite(sites.data.value!.find(site => site.siteUrl === currentRoute.params.slug)!)
  //   await res.forceRefresh()
  // }
  datePickerPeriod.value = {
    start: startDate.value,
    end: new Date().setDate(new Date().getDate() - 1),
  }
}

async function updateAnalyticsRange() {
  // TODO Fix
  // await $fetch('/api/user/me', {
  //   method: 'POST',
  //   body: {
  //     analyticsPeriod: '',
  //     analyticsRange: {
  //       start: range.start.getTime(),
  //       end: range.end.getTime(),
  //     },
  //   },
  // })
  // await fetch()
  // datePickerPeriod.value = range
}

const periodItems = [
  // days
  [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 3 months', value: '90d' },
    { label: 'Last 6 months', value: '180d' },
    { label: 'Last 12 months', value: '360d' },
  ],
  // months
  [
    { label: 'This Month', value: 'this-month' },
    { label: 'Last Month', value: 'last-month' },
    { label: 'This Year', value: 'this-year' },
    { label: 'Last Year', value: 'last-year' },
  ],
  [{ label: 'All time', value: 'all' }],
]

const dayjs = useDayjs()

const calenderPickerLabel = computed(() => {
  if (!user.value) {
    return ''
  }
  const period = user.value?.analyticsPeriod
  const range = user.value.analyticsRange
  if (!period && range) {
    // need to create a period string from the dates from user.value.analyticsRange
    const start = dayjs(range.start)
    const end = dayjs(range.end)
    // if end is not today or yesterday
    if (end.isBefore(dayjs().subtract(2, 'day')))
      return `${start.format('Do MMM YY')} - ${end.format('Do MMM YY')}`
    // should be like {days}d
    return `Last ${end.diff(start, 'days') + 1} days`
  }
  if (period) {
    if (period === 'all')
      return 'All time'
    if (period.endsWith('d'))
      return `Last ${period.replace('d', '')} days`
  }
  return 'Unknown'
})
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-end' }">
    <template #default="{ open }">
      <UButton size="xs" color="gray" icon="i-ph-calendar-dots-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
        {{ calenderPickerLabel }}
      </UButton>
    </template>

    <template #panel="{ close }">
      <div class="flex items-center divide-x divide-gray-200 dark:divide-gray-800">
        <DatePicker :model-value="datePickerPeriod" @update:model-value="updateAnalyticsRange" @close="close" />
        <div class="flex flex-col">
          <div class="ml-2 mb-2 font-bold">
            Period
          </div>
          <div class="flex flex-col max-h-[200px] overflow-y-scroll">
          <UButton
            v-for="(range, index) in periodItems.flat()"
            :key="index"
            :label="range.label"
            color="gray"
            size="xs"
            variant="ghost"
            class="rounded-none px-2"
            :trailing-icon="range.value === user?.analyticsPeriod ? 'i-heroicons-check-circle' : ''"
            :class="[range.value === user?.analyticsPeriod ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
            @click="updateAnalyticsPeriod(range.value)"
          />
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
