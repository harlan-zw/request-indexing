<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'
import { createLogoutHandler } from '~/composables/auth'
import { fetchSites } from '~/composables/fetch'

const { loggedIn, user } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')

const sites = ref((loggedIn.value && !isOnWelcome.value) ? await fetchSites().then(res => res.data.value?.sites) : [])

const sitesNavItem = computed(() => ({
  label: 'Sites',
  icon: 'i-ph-globe-duotone',
  children: sites.value?.map(site => ({
    label: withoutTrailingSlash(site.domain.replace('https://', '')),
    to: `/dashboard/site/${encodeURIComponent(site.siteId)}/overview`,
    icon: 'i-ph-browser-duotone',
  })) || [],
}))

const guidesNavItem = computed(() => ({
  label: 'Guides',
  icon: 'i-ph-books-duotone',
  children: [
    { label: 'Google Indexing API', to: '/google-indexing-api' },
    { label: 'Setup Tutorial', to: '/google-indexing-api-tutorial' },
    { label: 'Node.js Implementation', to: '/google-indexing-api-node-js' },
    { label: 'Bulk Submit URLs', to: '/bulk-submit-urls-google-indexing-api' },
    { label: 'For Blog Posts', to: '/indexing-api-for-blog-posts' },
    { label: 'Quota & Limits', to: '/google-indexing-api-quota' },
  ],
}))

const toolsNavItem = computed(() => ({
  label: 'Tools',
  icon: 'i-ph-wrench-duotone',
  children: [
    { label: 'Google Index Checker', to: '/tools/google-indexing-checker', icon: 'i-heroicons-magnifying-glass' },
    { label: 'Bulk Indexing Checker', to: '/tools/bulk-indexing-checker', icon: 'i-heroicons-queue-list' },
    { label: 'Site Indexing Report', to: '/tools/site-indexing-report', icon: 'i-heroicons-document-chart-bar' },
  ],
}))

const navigation = computed(() => {
  const items = [
    {
      label: 'Pricing',
      title: 'Pricing',
      icon: 'i-ph-tag-duotone',
      to: '/pricing',
      path: '/pricing',
      children: [],
    },
  ]
  if (loggedIn.value && !isOnWelcome.value) {
    items.unshift({
      label: 'Dashboard',
      title: 'Dashboard',
      icon: 'i-ph-chart-bar-duotone',
      to: '/dashboard',
      path: '/dashboard',
      children: [],
    })
  }
  return items
})

const authDropdownItems = computed(() => {
  if (isOnWelcome.value) {
    return [[
      {
        label: 'Logout',
        onSelect: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ]]
  }
  return [
    [
      { label: 'Account', to: '/account', icon: 'i-heroicons-user-circle' },
    ],
    user.value?.access === 'pro'
      ? false
      : [
          { label: 'Upgrade', to: '/account/upgrade', icon: 'i-heroicons-star' },
        ],
    [
      {
        label: 'Logout',
        onSelect: () => logout(),
        icon: 'i-heroicons-arrow-left-end-on-rectangle',
      },
    ],
  ].filter(Boolean)
})
</script>

<template>
  <UHeader :ui="{ root: 'border-none bg-transparent pt-2 mb-3 px-5 h-auto', container: 'max-w-[1452px] lg:bg-elevated/40 lg:border border-default mx-auto py-0 px-0 lg:px-5 sm:px-0 rounded-lg' }">
    <template #left>
      <NuxtLink
        to="/"
        title="Home"
        aria-label="Request Indexing"
        class="flex mr-4 items-center gap-2 font-bold text-xl text-default tracking-[-1.5px]"
      >
        <span class="text-primary italic">Request</span> Indexing
      </NuxtLink>
    </template>

    <template #default>
      <div class="hidden lg:flex items-center gap-1">
        <UNavigationMenu :items="navigation" class="justify-center" />
        <UNavigationMenu v-if="loggedIn && sites.length" :ui="{ viewport: 'min-w-[320px]' }" :items="[sitesNavItem]" class="justify-center">
          <template #item-content="{ item }">
            <ul class="grid grid-cols-2 p-2 gap-2">
              <li
                v-for="section in item.children"
                :key="section.to"
                class="text-left"
              >
                <UButton variant="ghost" :to="section.to" class="w-full justify-start text-left truncate">
                  <UIcon :name="section.icon" class="w-4 h-4 opacity-85 shrink-0" />
                  <span class="truncate text-sm">{{ section.label }}</span>
                </UButton>
              </li>
            </ul>
          </template>
        </UNavigationMenu>
        <UNavigationMenu :ui="{ viewport: 'min-w-[520px]' }" :items="[guidesNavItem]" class="justify-center">
          <template #item-content>
            <GuidesMenu />
          </template>
        </UNavigationMenu>
        <UNavigationMenu :ui="{ viewport: 'min-w-[520px]' }" :items="[toolsNavItem]" class="justify-center">
          <template #item-content>
            <ToolsMenu />
          </template>
        </UNavigationMenu>
      </div>
    </template>

    <template #body>
      <div class="space-y-5">
        <UContentNavigation :navigation="navigation" />
        <div v-if="loggedIn && sites.length">
          <div class="text-muted text-sm mb-3">
            Sites
          </div>
          <UContentNavigation :navigation="sitesNavItem.children" />
        </div>
        <div>
          <div class="text-muted text-sm mb-3">
            Guides
          </div>
          <UContentNavigation :navigation="guidesNavItem.children" />
        </div>
        <div>
          <div class="text-muted text-sm mb-3">
            Tools
          </div>
          <UContentNavigation :navigation="toolsNavItem.children" />
        </div>
      </div>
    </template>

    <template #right>
      <div class="flex items-center justify-end lg:-mr-1.5 ml-3 gap-3">
        <UColorModeButton />

        <UButton
          aria-label="Request Indexing on GitHub"
          to="https://github.com/harlan-zw/request-indexing"
          target="_blank"
          color="neutral"
          variant="ghost"
          class="hidden lg:inline-flex transition opacity-85"
          icon="i-simple-icons-github"
        />

        <template v-if="!loggedIn">
          <UButton to="/get-started" external color="neutral" variant="ghost" class="hidden md:flex">
            Login
          </UButton>
          <UButton to="/get-started" external color="primary" variant="solid">
            Get Started
          </UButton>
        </template>
        <template v-else>
          <UDropdownMenu :items="authDropdownItems" mode="hover" class="flex items-center">
            <UButton color="neutral" variant="ghost" class="p-0">
              <UAvatar :src="user.picture" size="sm" />
              <UBadge v-if="user.access === 'pro'" label="Pro" color="primary" variant="subtle" class="ml-1" size="sm" />
              <UIcon name="i-heroicons-chevron-down" class="w-4 h-4 ml-1 opacity-50" />
            </UButton>
          </UDropdownMenu>
        </template>
      </div>
    </template>
  </UHeader>
</template>
