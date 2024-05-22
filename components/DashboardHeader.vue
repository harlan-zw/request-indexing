<script setup lang="ts">
import countries from '../server/data/countries'
import { createLogoutHandler } from '~/composables/auth'
import { fetchSites } from '~/composables/fetch'
import type { UserSelect } from '~/server/database/schema'

const { loggedIn, user, session } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()
const color = useColorMode()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')
const isOnDashboard = computed(() => router.currentRoute.value.path.startsWith('/dashboard'))

const sites = ref(loggedIn.value ? await fetchSites().then(res => res.data.value?.sites) : [])

const authDropdownItems: DropdownItem[][] = computed(() => {
  if (isOnWelcome.value) {
    return [[
      {
        label: 'Logout',
        click: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ]]
  }
  return [
    [
      { label: 'Account', slot: 'account', to: '/account', icon: 'i-heroicons-user-circle' },
    ],
    user.value.access === 'pro'
      ? false
      : [
        // upgrade to pro item
          { label: 'Upgrade', slot: 'pro', to: '/account/upgrade', icon: 'i-heroicons-star' },
        ],
    [
      {
        label: 'Logout',
        click: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ],
  ].filter(Boolean)
})

// use user.analyticsPeriod
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
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({
      analyticsPeriod: newPeriod,
    }),
  })
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

async function updateAnalyticsRange(range: any) {
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: {
      analyticsPeriod: '',
      analyticsRange: {
        start: range.start.getTime(),
        end: range.end.getTime(),
      },
    },
  })
  datePickerPeriod.value = range
}

const periodItems = [
  // days
  [
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 365 Days', value: '365d' },
  ],
  // months
  [
    { label: 'This Month', value: 'this-month' },
    { label: 'Last Month', value: 'last-month' },
    { label: 'This Month', value: 'this-year' },
    { label: 'Last Month', value: 'last-year' },
  ],
  [{ label: 'All time', value: 'all' }],
]

const dayjs = useDayjs()

const calenderPickerLabel = computed(() => {
  const period = user.value?.analyticsPeriod
  if (!period) {
    // need to create a period string from the dates from user.value.analyticsRange
    const start = dayjs(user.value.analyticsRange.start)
    const end = dayjs(user.value.analyticsRange.end)
    // if end is not today or yesterday
    if (end.isBefore(dayjs().subtract(2, 'day')))
      return `${start.format('Do MMM YY')} - ${end.format('Do MMM YY')}`
    // should be like {days}d
    return `Last ${end.diff(start, 'days') + 1} days`
  }
  if (user.value.analyticsPeriod === 'all')
    return 'All time'
  if (user.value.analyticsPeriod.endsWith('d'))
    return `Last ${user.value.analyticsPeriod.replace('d', '')} days`
  return 'Unknown'
})

const allCountries = countries.map(country => ({
  label: country.name,
  value: country['alpha-3'],
  icon: `i-circle-flags-${country['alpha-2'].toLowerCase()}`,
}))
</script>

<template>
  <UDashboardNavbar>
    <template #title>
      <slot />
      <DashboardPageTitle
        v-if="$route.meta"
        :icon="$route.meta.icon"
        :title="$route.meta.title"
        :description="$route.meta.description"
      />
    </template>
    <template #right>
      <div class="flex items-center">
        <div class="items-center gap-4 mr-5 hidden md:flex ">
          <!--          <UPopover mode="hover" :popper="{ placement: 'bottom-start' }"> -->
          <!--            <template #default="{ open }"> -->
          <!--            <UButton color="gray" icon="i-heroicons-chart-bar-square" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down"> -->
          <!--              Customize -->
          <!--            </UButton> -->
          <!--            </template> -->
          <!--            <template #panel> -->
          <!--            <div class="p-5 flex flex-col gap-3"> -->
          <!--              <div class="flex items-center gap-1"> -->
          <!--                <label class="text-xs hover:opacity-100 opacity-70 flex items-center gap-1 cursor-pointer">Lines -->
          <!--                  <USelect model-value="ema" size="xs" :options="[{ label: 'Default', value: '' }, { label: 'EMA', value: 'ema' }, { label: 'SMA', value: 'sma' }]" /> -->
          <!--                </label> -->
          <!--              </div> -->
          <!--            </div> -->
          <!--            </template> -->
          <!--          </UPopover> -->
          <USelectMenu searchable searchable-placeholder="Search a location..." size="xs" :options="allCountries">
            <template #default="{ open }">
              <UButton color="gray" icon="i-ph-globe-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid" @click="open">
                All locations
              </UButton>
            </template>
            <template #option="{ option: country }">
              <Icon :name="country.icon" class="w-4 h-4" />
              <span class="truncate">{{ country.label }}</span>
            </template>
          </USelectMenu>
          <UPopover mode="hover" :popper="{ placement: 'bottom-end' }">
            <template #default="{ open }">
              <UButton color="gray" icon="i-ph-calendar-dots-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
                {{ calenderPickerLabel }}
              </UButton>
            </template>

            <template #panel="{ close }">
              <div class="flex items-center divide-x divide-gray-200 dark:divide-gray-800">
                <DatePicker :model-value="datePickerPeriod" @update:model-value="updateAnalyticsRange" @close="close" />
                <div class="flex flex-col py-4">
                  <div class="ml-6 font-bold">
                    Period
                  </div>
                  <UButton
                    v-for="(range, index) in periodItems.flat()"
                    :key="index"
                    :label="range.label"
                    color="gray"
                    variant="ghost"
                    class="rounded-none px-6"
                    :trailing-icon="range.value === user?.analyticsPeriod ? 'i-heroicons-check-circle' : ''"
                    :class="[range.value === user?.analyticsPeriod ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                    @click="updateAnalyticsPeriod(range.value)"
                  />
                </div>
              </div>
            </template>
          </UPopover>
        </div>
        <UDropdown :items="authDropdownItems" mode="hover" class="flex items-center">
          <template #account="{ item }">
            <div class="flex flex-col w-full">
              <div class="flex items-center gap-2">
                <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <span class="truncate">{{ item.label }}</span>
              </div>
              <div class="text-gray-400 text-xs">
                {{ user.email }}
              </div>
            </div>
          </template>
          <template #pro="{ item }">
            <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span class="truncate">{{ item.label }}</span>
            <UBadge label="0 left" color="purple" variant="subtle" class="ml-0.5" />
          </template>
          <UAvatar :src="user.picture" />
          <div class="ml-2 flex items-center">
            <UBadge v-if="user.access === 'pro'" label="Pro" color="purple" variant="subtle" class="ml-0.5" />
          </div>
          <UButton
            icon="i-heroicons-chevron-down"
            color="gray"
            size="xs"
            variant="ghost"
          />
        </UDropdown>
      </div>
    </template>
  </UDashboardNavbar>
</template>
