<script setup lang="ts">
import { createLogoutHandler } from '~/composables/auth'
import type { DropdownItem } from '#ui/types'
import type { User } from '~/types'

const { loggedIn, user, session } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()

const links = computed(
  () => loggedIn.value
    ? [{
        label: 'Dashboard',
        to: '/dashboard',
      }]
    : [],
)

const authDropdownItems: DropdownItem[][] = [
  [
    { label: 'Account', to: '/account', icon: 'i-heroicons-user-circle' },
  ],
  [
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
]

async function updateAnalyticsPeriod(newPeriod: User['analyticsPeriod']) {
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({ analyticsPeriod: newPeriod }),
  })
  const currentRoute = router.currentRoute.value
  const sites = await fetchSites()
  // refresh all sites
  if (currentRoute.path === '/dashboard') {
    for (const site of sites.data.value!) {
      const res = await fetchSite(site)
      await res.forceRefresh()
    }
  }
  else if (currentRoute.name === 'dashboard-site-slug') {
    const res = await fetchSite(sites.data.value!.find(site => site.siteUrl === currentRoute.params.slug)!)
    await res.forceRefresh()
  }
}

const periodItems = [
  [{ slot: 'info', disabled: true }],
  // days
  [
    { label: '7 days', value: '7d', click: () => updateAnalyticsPeriod('7d') },
    { label: '28 days', value: '28d', click: () => updateAnalyticsPeriod('28d') },
  ],
  // months
  [
    { label: '3 months', value: '3mo', click: () => updateAnalyticsPeriod('3mo') },
    { label: '6 months', value: '6mo', click: () => updateAnalyticsPeriod('6mo') },
    { label: '12 months', value: '12mo', click: () => updateAnalyticsPeriod('12mo') },
    { label: '16 months', value: '16mo', click: () => updateAnalyticsPeriod('16mo') },
  ],
]
</script>

<template>
  <UHeader :links="links">
    <template #logo>
      <div class="flex items-center gap-2">
        <svg height="25" width="25" class="d-inline-block mt-1" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#00DC82" d="M62.3,-53.9C74.4,-34.5,73.5,-9,67.1,13.8C60.6,36.5,48.7,56.5,30.7,66.1C12.7,75.7,-11.4,74.8,-31.6,65.2C-51.8,55.7,-67.9,37.4,-73.8,15.7C-79.6,-6,-75.1,-31.2,-61.1,-51C-47.1,-70.9,-23.6,-85.4,0.8,-86C25.1,-86.7,50.2,-73.4,62.3,-53.9Z" transform="translate(100 100)" />
        </svg>
        <div class="text-black-800">
          Request Indexing
        </div>
      </div>
    </template>

    <template #right>
      <div v-if="!loggedIn" class="mr-7 gap-2 flex">
        <GithubStar v-slot="{ stars }" repo="harlan-zw/nuxt-seo" class="hidden lg:flex group border dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-700 hover:bg-gray-200 dark:bg-gray-900 bg-gray-100 transition rounded-lg text-sm justify-center">
          <div class="flex items-center transition rounded-l px-2 py-1 space-x-1">
            <Icon name="uil:star" class="group-hover:op75 " />
            <div>Star</div>
          </div>
          <div class="px-2 py-1 dark:bg-black/20 bg-white rounded-r-lg">
            {{ stars }}
          </div>
        </GithubStar>

        <UButton
          title="Twitter"
          aria-label="Twitter"
          to="https://twitter.com/harlan_zw"
          target="_blank"
          color="gray"
          variant="ghost"
          class="hidden lg:inline-flex"
          icon="i-simple-icons-twitter"
        />

        <UButton
          title="GitHub"
          aria-label="GitHub"
          to="https://github.com/harlan-zw/nuxt-seo"
          target="_blank"
          color="gray"
          variant="ghost"
          class="hidden lg:inline-flex"
          icon="i-simple-icons-github"
        />
      </div>

      <UButton v-if="!loggedIn" to="/get-started" external color="gray">
        <span>Get Started</span>
      </UButton>
      <template v-else>
        <div class="items-center gap-2 hidden md:flex">
          <UDropdown mode="click" :items="periodItems" class="mr-5">
            <template #info>
              <p class="text-xs">
                Change the period used to display your site data.
              </p>
            </template>
            <template #item="{ item }">
              <template v-if="item.value === user.analyticsPeriod">
                <span class="truncate font-bold">{{ item.label }}</span>
                <UIcon v name="i-heroicons-check-circle" class="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500" />
              </template>
              <template v-else>
                <span class="truncate">{{ item.label }}</span>
              </template>
            </template>
            <UButton
              icon="i-heroicons-calendar"
              color="gray"
              size="xs"
            >
              <template v-if="user.analyticsPeriod.endsWith('d')">
                {{ user.analyticsPeriod.replace('d', '') }} days
              </template>
              <template v-else>
                {{ user.analyticsPeriod.replace('mo', '') }} months
              </template>
            </UButton>
          </UDropdown>
        </div>
        <UDropdown mode="click" :items="authDropdownItems">
          <template #pro="{ item }">
            <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <span class="truncate">{{ item.label }}</span>
            <UBadge label="4 available" color="purple" variant="subtle" class="ml-0.5" />
          </template>
          <UAvatar :src="user.picture" />
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
      <UNavigationTree :links="authDropdownItems[0]" default-open />
    </template>
  </UHeader>
</template>
