<script setup lang="ts">
import { NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuRoot, NavigationMenuTrigger, NavigationMenuViewport } from 'reka-ui'
import { withoutTrailingSlash } from 'ufo'
import { createLogoutHandler } from '~/composables/auth'
import { fetchSites } from '~/composables/fetch'

const { loggedIn, user } = useUserSession()

const logout = createLogoutHandler()
const router = useRouter()

const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')

const sites = ref((loggedIn.value && !isOnWelcome.value) ? await fetchSites().then(res => res.data.value?.sites) : [])

const hasSites = computed(() => loggedIn.value && !isOnWelcome.value && (sites.value?.length ?? 0) > 0)

const megaMenuItems = computed(() => {
  const items: Array<{ value: string, label: string, icon: string, to: string, hasDropdown: boolean }> = []
  if (loggedIn.value && !isOnWelcome.value) {
    items.push({ value: 'dashboard', label: 'Dashboard', icon: 'i-ph-chart-bar-duotone', to: '/dashboard', hasDropdown: false })
  }
  if (hasSites.value) {
    items.push({ value: 'sites', label: 'Sites', icon: 'i-ph-globe-duotone', to: '/dashboard', hasDropdown: true })
  }
  items.push(
    { value: 'guides', label: 'Guides', icon: 'i-ph-books-duotone', to: '/guides', hasDropdown: true },
    { value: 'tools', label: 'Tools', icon: 'i-ph-wrench-duotone', to: '/tools', hasDropdown: true },
    { value: 'pricing', label: 'Pricing', icon: 'i-ph-tag-duotone', to: '/pricing', hasDropdown: false },
  )
  return items
})

// Mobile nav data
const mobileGuides = [
  { label: 'Google Indexing API', icon: 'i-heroicons-book-open', to: '/google-indexing-api' },
  { label: 'Setup Tutorial', icon: 'i-heroicons-academic-cap', to: '/google-indexing-api-tutorial' },
  { label: 'Node.js Implementation', icon: 'i-simple-icons-nodedotjs', to: '/google-indexing-api-node-js' },
  { label: 'Bulk Submit URLs', icon: 'i-heroicons-arrow-up-tray', to: '/bulk-submit-urls-google-indexing-api' },
  { label: 'For Blog Posts', icon: 'i-heroicons-document-text', to: '/indexing-api-for-blog-posts' },
  { label: 'Quota & Limits', icon: 'i-heroicons-chart-bar', to: '/google-indexing-api-quota' },
]

const mobileTools = [
  { label: 'Google Index Checker', icon: 'i-heroicons-magnifying-glass', to: '/tools/google-indexing-checker' },
  { label: 'Bulk Indexing Checker', icon: 'i-heroicons-queue-list', to: '/tools/bulk-indexing-checker' },
  { label: 'Site Indexing Report', icon: 'i-heroicons-document-chart-bar', to: '/tools/site-indexing-report' },
]

const mobileSites = computed(() =>
  (sites.value ?? []).map(site => ({
    label: withoutTrailingSlash(site.domain.replace('https://', '')),
    icon: 'i-ph-browser-duotone',
    to: `/dashboard/site/${encodeURIComponent(site.siteId)}/overview`,
  })),
)

function withTitle<T extends { label: string }>(items: T[]) {
  return items.map(m => ({ ...m, title: m.label }))
}

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
      <NavigationMenuRoot class="hidden lg:flex justify-center relative py-2">
        <NavigationMenuList class="flex items-center gap-0.5">
          <NavigationMenuItem v-for="item in megaMenuItems" :key="item.value" :value="item.value">
            <template v-if="item.hasDropdown">
              <NavigationMenuTrigger as-child>
                <NuxtLink
                  :to="item.to"
                  class="group relative flex items-center gap-1.5 font-medium text-sm px-2.5 py-1.5 before:absolute before:z-[-1] before:rounded-md before:inset-x-px before:inset-y-0 data-[state=open]:before:bg-elevated data-[state=open]:text-highlighted before:transition-colors transition-colors"
                >
                  <UIcon :name="item.icon" class="shrink-0 size-4 opacity-50 group-hover:opacity-80 group-data-[state=open]:opacity-90 transition-opacity" />
                  {{ item.label }}
                </NuxtLink>
              </NavigationMenuTrigger>
              <NavigationMenuContent
                class="absolute top-0 left-0 w-auto data-[motion=from-start]:animate-[enter-from-left_200ms_ease] data-[motion=from-end]:animate-[enter-from-right_200ms_ease] data-[motion=to-start]:animate-[exit-to-left_200ms_ease] data-[motion=to-end]:animate-[exit-to-right_200ms_ease]"
              >
                <HeaderSitesMenu v-if="item.value === 'sites'" :sites="sites ?? []" />
                <HeaderGuidesMenu v-else-if="item.value === 'guides'" />
                <HeaderToolsMenu v-else-if="item.value === 'tools'" />
              </NavigationMenuContent>
            </template>

            <NuxtLink
              v-else
              :to="item.to"
              class="group relative flex items-center gap-1.5 font-medium text-sm px-2.5 py-1.5 before:absolute before:z-[-1] before:rounded-md before:inset-x-px before:inset-y-0 before:transition-colors transition-colors"
            >
              <UIcon :name="item.icon" class="shrink-0 size-4 opacity-50 group-hover:opacity-80 transition-opacity" />
              {{ item.label }}
            </NuxtLink>
          </NavigationMenuItem>
        </NavigationMenuList>

        <Teleport to="body">
          <NavigationMenuViewport
            class="fixed top-[60px] left-1/2 -translate-x-1/2 overflow-hidden bg-elevated shadow-xl rounded-md ring-1 ring-[var(--ui-border-accented)] h-(--reka-navigation-menu-viewport-height) w-(--reka-navigation-menu-viewport-width) transition-[width,height] duration-200 origin-[top_center] data-[state=open]:animate-[scale-in_100ms_ease-out] data-[state=closed]:animate-[scale-out_100ms_ease-in] z-[100]"
          />
        </Teleport>
      </NavigationMenuRoot>
    </template>

    <template #body>
      <div class="space-y-5">
        <div v-if="hasSites">
          <div class="text-muted text-sm mb-3">
            Sites
          </div>
          <UContentNavigation :navigation="withTitle(mobileSites)" />
        </div>
        <div>
          <div class="text-muted text-sm mb-3">
            Guides
          </div>
          <UContentNavigation :navigation="withTitle(mobileGuides)" />
        </div>
        <div>
          <div class="text-muted text-sm mb-3">
            Tools
          </div>
          <UContentNavigation :navigation="withTitle(mobileTools)" />
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
