<script setup lang="ts">
import { createLogoutHandler } from '~/composables/auth'
import type { User } from '~/types'
import { fetchSites } from '~/composables/fetch'

const { loggedIn, user, session } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()
const color = useColorMode()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/welcome')
const isOnDashboard = computed(() => router.currentRoute.value.path.startsWith('/dashboard'))

const sites = ref(loggedIn.value ? await fetchSites().then(res => res.data.value?.sites) : [])
const links = computed(() => {
  if (loggedIn.value && !isOnWelcome.value) {
    return [
      {
        label: 'Dashboards',
        icon: 'i-heroicons-window',
        to: '/dashboard',
        children: [{
          label: 'Clicks & Impressions',
          icon: 'i-heroicons-cursor-arrow-rays',
          to: '/dashboard',
          description: 'View your sites with stats about their clicks and impressions.',
        }, {
          label: 'Position & CTR',
          icon: 'i-heroicons-chart-bar',
          to: '/dashboard/position',
          description: 'View your sites with stats about their keyword positions and click-through-rates.',
        }, {
          label: 'Pagespeed Insights',
          to: '/dashboard/pagespeed-insights',
          icon: 'i-heroicons-rocket-launch',
          description: 'See how all of your sites are performance cumulatively.',
        }, {
          label: 'CrUX',
          icon: 'i-heroicons-users',
          to: '/dashboard/crux',
          description: 'View your sites with stats about their clicks and impressions.',
        }],
      },
      {
        label: 'Sites',
        icon: 'i-heroicons-queue-list',
        children: sites.value?.map(site => ({
          label: site.domain,
          to: `/dashboard/site/${encodeURIComponent(site.domain)}`,
          icon: 'i-heroicons-globe',
        })),
      },
      {
        label: 'Keyword Research',
        icon: 'i-heroicons-square-3-stack-3d',
        to: `/dashboard/keyword-research`,
      },
      // {
      //   label: 'Resources',
      //   icon: 'i-heroicons-square-3-stack-3d',
      //   to: '/pro',
      //   children: [
      //     {
      //       label: 'Changelog',
      //       icon: 'i-heroicons-rocket-launch',
      //       to: '/releases',
      //       description: 'See what\'s new in the latest release.',
      //     },
      //     {
      //       label: 'Submit an issue',
      //       icon: 'i-heroicons-rocket-launch',
      //       to: '/releases',
      //       description: 'See what\'s new in the latest release.',
      //     },
      //     {
      //       label: 'Request a feature',
      //       icon: 'i-heroicons-rocket-launch',
      //       to: '/releases',
      //       description: 'See what\'s new in the latest release.',
      //     },
      //     {
      //       label: 'Discord Support',
      //       to: '/pro/templates',
      //       icon: 'i-heroicons-computer-desktop',
      //       description: 'Get started with one of our official templates.',
      //     },
      //   ],
      // }
    ]
  }
  return [
    [
      {
        label: 'Pricing',
        icon: 'i-heroicons-star',
        to: '/pricing',
      },
    ],
  ]
})

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

async function updateAnalyticsPeriod(newPeriod: User['analyticsPeriod']) {
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

const disabledMetrics = ref([])

function toggleFilter(filter) {
  if (disabledMetrics.value.includes(filter))
    disabledMetrics.value = disabledMetrics.value.filter(f => f !== filter)
  else
    disabledMetrics.value = [...disabledMetrics.value, filter]
  session.value = {
    ...session.value,
    disabledMetrics: disabledMetrics.value,
    user: {
      ...session.value.user,
      disabledMetrics: disabledMetrics.value,
    },
  }
}
const smoothLines = ref('')

watch(smoothLines, () => {
  session.value = {
    ...session.value,
    smoothLines,
  }
})

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
})
</script>

<template>
  <UHeader :links="links" :ui="{ container: 'w-full max-w-full' }">
    <template #left>
      <ULink to="/" color="gray" size="xs" class="flex items-center gap-2 group mr-10">
        <div class="text-black dark:text-white font-title font-semibold whitespace-nowrap text-xl" style="letter-spacing: -1.5px;">
          Request Indexing
        </div>
        <svg height="25" width="25" class="text-green-500 group-hover:text-green-300 transition" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 267 262" xml:space="preserve">
          <!-- magnifying glass  -->
          <path class="text-gray-900 dark:text-gray-200" fill="currentColor" d="M263.158 210.588a356.834 356.834 0 0 1-4.262 20.272c-6.823 10.235-16.074 16.193-27.508 15.709-9.868-.419-18.375-5.864-25.2-13.736-7.18-7.119-14.246-13.954-21.458-21.087-4.04-3.958-7.935-7.62-11.912-11.405-.083-.122-.328-.288-.451-.52-.814-.79-1.505-1.35-2.333-2.224-5.983-5.888-11.828-11.46-16.3-15.723-9.814 1.528-18.278 2.847-27.163 4.085-3.796-.411-7.172-.742-10.549-1.072-19.389-5.02-33.04-16.713-40.374-35.368-10.582-26.915.226-58.306 24.396-71.556 25.178-13.803 57.44-7.278 74.137 15.112 6.41 8.596 10.107 18.333 10.876 29.054.275 3.834 1.534 6.756 4.436 9.489 21.078 19.857 42.005 39.875 62.945 59.878 5.396 5.154 9.691 10.99 10.72 19.092m-69.483-19.776c.804.663 1.608 1.325 2.566 2.512.287.213.573.427 1.057 1.278 2.907 2.725 5.815 5.45 9.127 8.72 2.455 2.256 4.911 4.512 7.592 7.414 3.66 3.52 7.319 7.042 11.37 11.21 3.465 3.398 7.165 5.256 11.897 2.24 4.23-2.697 5.523-6.184 4.113-12.584-2.101-2.542-3.977-5.32-6.341-7.588-13.16-12.62-26.433-25.122-39.679-37.653-4.967-4.698-9.964-9.365-15.173-14.258-2.053 3.451-3.647 6.132-5.838 9.14l-5.036 5.914c6.051 5.716 11.883 11.225 17.91 17.228.29.192.579.384 1.088 1.179 1.682 1.562 3.364 3.124 5.347 5.248m-43.732-90.58c-10.045-7.61-21.03-9.549-33.713-5.474-1.433.688-2.866 1.375-4.906 2.127-.823.554-1.645 1.107-3.11 1.95-1.039.934-2.077 1.87-3.61 2.887-.303.377-.606.755-1.512 1.472-5.304 5.515-8.8 11.892-9.804 20.37-1.858 24.173 14.898 41.888 38.296 40.312 2.839-.19 5.615-1.305 9.083-1.922.778-.395 1.557-.79 2.999-1.304 4.836-4.424 9.673-8.849 15.047-13.656.408-.997.816-1.995 1.76-3.519 3.31-7.65 3.88-15.5 1.815-24.308-.937-2.443-1.875-4.887-2.895-7.816 0 0-.342-.355-.329-.988-.84-1.146-1.681-2.293-2.834-4.067-1.981-1.82-3.963-3.64-6.287-6.063z" />
          <path fill="currentColor" d="M142.168 224.923c-.526 1.84-1.433 3.664-1.505 5.52-.188 4.822.056 9.658.009 14.487-.057 5.809-2.836 8.954-8.622 9.652a36.509 36.509 0 0 1-6.98.147c-5.381-.391-8.263-3.162-8.426-8.61-.247-8.319-.117-16.65-.165-24.975-.025-4.483 1.265-8.377 5.64-10.267 4.862-2.1 9.787-1.754 14.345 1.032 1.224.748 2.085 2.088 3.38 3.442.266.285.322.316.323.626.354 2.784.706 5.26 1.107 7.933.332.47.613.742.894 1.013z" />
          <path fill="currentColor" d="M229.032 137.723c-2.992-.023-5.493.017-7.988-.077-7.696-.289-11.938-4.695-11.957-12.346-.018-7.269 4.268-11.49 11.917-11.63 7.66-.14 15.322-.278 22.983-.27 7.137.006 10.745 4.34 10.699 12.578-.046 8.296-3.206 11.818-10.67 11.827-4.83.006-9.66-.05-14.984-.082z" />
          <path fill="currentColor" d="M25.01 137.827c-4.32-.054-8.17.15-11.964-.22-6.226-.61-8.5-4.17-8.358-12.357.126-7.24 3.074-11.277 8.997-11.502 8.31-.314 16.64-.423 24.953-.257 6.21.125 10.54 5.497 10.444 12.268-.101 7.245-4.43 11.996-11.095 12.082-4.16.054-8.32-.005-12.976-.014z" />
          <path fill="currentColor" d="M116.648 11.1c3.823-6.647 16.339-8.611 21.333-3.45 1.458 1.506 2.47 4.046 2.56 6.16.316 7.3.195 14.62.127 21.933-.068 7.247-3.83 11.077-10.982 11.382-8.093.345-12.946-3.286-13.235-10.728-.32-8.287.032-16.599.197-25.298z" />
          <path fill="currentColor" d="M72.732 206.65c-4.6 4.605-8.826 9.08-13.316 13.273-4.275 3.993-7.4 4.17-11.957.613-2.451-1.914-4.745-4.227-6.512-6.775-3.156-4.553-2.753-8.061 1.071-12.05 4.254-4.435 8.672-8.716 13.059-13.022 6.077-5.966 11.537-6.346 16.865-1.235 6.481 6.217 6.842 12.726.79 19.196z" />
          <path fill="currentColor" d="M196.987 72.077c-5.68.823-10.224-.669-13.739-4.82-4.215-4.979-4.175-10.527.33-15.182 4.389-4.536 8.932-8.93 13.54-13.243 4.206-3.936 8.573-4.372 12.893-.621 2.793 2.425 5.056 5.692 6.809 8.98.834 1.564.758 4.848-.333 6-6.143 6.484-12.72 12.557-19.5 18.886z" />
          <path fill="currentColor" d="M77.148 59.041c-.723 5.547-3.386 9.498-7.936 11.834-4.095 2.103-8.397 2.318-12.106-1.054-5.422-4.927-10.722-9.99-16.12-14.944-2.673-2.454-3.005-5.423-.94-8.037 2.857-3.616 5.937-7.273 9.634-9.915 1.78-1.271 6.2-1.4 7.693-.084 6.712 5.92 12.833 12.514 19.07 18.96.584.605.481 1.875.705 3.24z" />
        </svg>
      </ULink>
      <HeaderLinks :links="links" />
    </template>
    <template #center>
      <div> <!--  empty --></div>
    </template>
    <template #right>
      <div v-if="!loggedIn" class="flex gap-3 items-center gap-2">
        <UButton to="/get-started" external color="gray" variant="link" class="hidden md:block">
          <span>Login</span>
        </UButton>
        <UButton to="/get-started" external color="green" variant="outline">
          <span>Get Started</span>
        </UButton>
      </div>
      <template v-else>
        <div v-if="user && isOnDashboard && !isOnWelcome" class="items-center gap-4 mr-5 hidden md:flex">
          <UPopover mode="hover" :popper="{ placement: 'bottom-start' }">
            <template #default="{ open }">
              <UButton color="gray" icon="i-heroicons-chart-bar-square" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down">
                Customize
              </UButton>
            </template>
            <template #panel>
              <div class="p-5 flex flex-col gap-3">
                <label class="text-xs flex justify-between w-full items-center gap-3 cursor-pointer">
                  <div class="flex items-center gap-1">
                    <IconClicks />
                    Clicks
                  </div>
                  <UToggle :model-value="!disabledMetrics.includes('clicks')" class="flex" :color="color.value === 'dark' ? 'green' : 'blue'" size="xs" on-icon="i-heroicons-check" off-icon="i-heroicons-x-mark" @update:model-value="toggleFilter('clicks')" />
                </label>
                <label class="text-xs flex items-center justify-between gap-3 cursor-pointer">
                  <div class="flex items-center gap-1">
                    <IconImpressions />
                    Impressions
                  </div>
                  <UToggle :model-value="!disabledMetrics.includes('impressions')" class="flex" color="purple" size="xs" on-icon="i-heroicons-check" off-icon="i-heroicons-x-mark" @update:model-value="toggleFilter('impressions')" />
                </label>
                <div class="flex items-center gap-1">
                  <label class="text-xs hover:opacity-100 opacity-70 flex items-center gap-1 cursor-pointer">Lines
                    <USelect v-model="smoothLines" size="xs" :options="[{ label: 'Default', value: '' }, { label: 'EMA', value: 'ema' }, { label: 'SMA', value: 'sma' }]" />
                  </label>
                </div>
              </div>
            </template>
          </UPopover>
          <UPopover mode="hover" :popper="{ placement: 'bottom-end' }">
            <template #default="{ open }">
              <UButton color="gray" icon="i-heroicons-calendar-days" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
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

          <!--                      <UDropdown mode="click" :items="periodItems"> -->
          <!--                        <template #info> -->
          <!--                          <p class="text-xs"> -->
          <!--                            Change the period used to display your site data. -->
          <!--                          </p> -->
          <!--                        </template> -->
          <!--                        <template #item="{ item }"> -->
          <!--                          <template v-if="item.value === user.analyticsPeriod"> -->
          <!--                            <span class="truncate font-bold">{{ item.label }}</span> -->
          <!--                            <UIcon v name="i-heroicons-check-circle" class="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500" /> -->
          <!--                          </template> -->
          <!--                          <template v-else> -->
          <!--                            <span class="truncate">{{ item.label }}</span> -->
          <!--                          </template> -->
          <!--                        </template> -->
          <!--                        <UButton -->
          <!--                          icon="i-heroicons-calendar" -->
          <!--                          color="gray" -->
          <!--                          size="xs" -->
          <!--                        > -->
          <!--                          <template v-if="user.analyticsPeriod === 'all'"> -->
          <!--                            All time -->
          <!--                          </template> -->
          <!--                          <template v-else-if="user.analyticsPeriod.endsWith('d')"> -->
          <!--                            {{ user.analyticsPeriod.replace('d', '') }} days -->
          <!--                          </template> -->
          <!--                          <template v-else> -->
          <!--                            {{ user.analyticsPeriod.replace('mo', '') }} months -->
          <!--                          </template> -->
          <!--                        </UButton> -->
          <!--                      </UDropdown> -->
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
            <UBadge label="3 left" color="purple" variant="subtle" class="ml-0.5" />
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
      </template>
    </template>

    <template #panel>
      <UNavigationTree
        v-if="loggedIn"
        :links="[links[0], ...authDropdownItems.flat()]" default-open
      />
      <UButton v-else to="/get-started" external color="green" variant="outline">
        <span>Get Started</span>
      </UButton>
    </template>
  </UHeader>
</template>
