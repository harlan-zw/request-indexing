<script lang="ts" setup>
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { joinURL, withoutTrailingSlash } from 'ufo'
import { fetchSites } from '~~/layers/core/app/composables/fetch'
import DashboardShell from './_DashboardShell.vue'

const router = useRouter()
const route = useRoute()
const { session } = useUserSession()

const { data } = await fetchSites()
const sites = computed(() => data.value?.sites || [])

const isOnWelcome = computed(() => router.currentRoute.value.path === ONBOARDING_ROUTE)
const onboarding = computed(() => resolveTeamOnboarding(session.value))

watch([isOnWelcome, onboarding], ([onWelcome, state]) => {
  if (!onWelcome && needsOnboarding(state))
    router.push(ONBOARDING_ROUTE)
}, { immediate: true })

const site = computed(() => {
  const slug = route.params.slug as string | undefined
  if (!slug)
    return undefined
  return sites.value.find(candidate => String(candidate.siteId) === slug)
})

const pageTitle = computed(() => String(route.meta.subTitle || route.meta.title || 'Dashboard'))
const pageIcon = computed(() => typeof route.meta.icon === 'string' ? route.meta.icon : undefined)

const dashboards = computed<NavigationMenuItem[]>(() => !site.value
  ? []
  : [
      { label: 'Organic Search', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'overview'), icon: 'i-ph-app-window-duotone' },
      { label: 'Keyword Insights', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'keyword-insights'), icon: 'i-ph-lightning-duotone' },
      { label: 'Web Indexing', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'web-indexing'), icon: 'i-ph-check-circle-duotone' },
      { label: 'Analysis', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'analysis'), icon: 'i-ph-chart-pie-slice-duotone' },
      { label: 'Sitemaps', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'sitemaps'), icon: 'i-ph-map-trifold-duotone' },
    ])

const siteLinks = computed<NavigationMenuItem[]>(() => !site.value
  ? []
  : [
      { label: 'Pages', icon: 'i-heroicons-folder', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'pages') },
      { label: 'Keywords', icon: 'i-heroicons-magnifying-glass-circle', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'keywords') },
      { label: 'Countries', icon: 'i-ph-globe-hemisphere-east-duotone', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'countries') },
    ])

const apiLinks = computed<NavigationMenuItem[]>(() => !site.value
  ? []
  : [
      { label: 'API Usages', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'usages') },
      { label: 'Data & Exports', to: joinURL('/dashboard/site', encodeURIComponent(site.value.siteId), 'data') },
    ])

const teamLinks = computed<NavigationMenuItem[]>(() => [
  { label: 'Members', to: '/dashboard/team/members', icon: 'i-heroicons-users' },
  { label: 'Settings', to: '/dashboard/team/settings', icon: 'i-heroicons-cog' },
])

const onlySiteLinks = computed<NavigationMenuItem[]>(() => sites.value.map((candidate) => {
  const label = siteLabel(candidate)
  return {
    label,
    to: candidate.isSynced ? `/dashboard/site/${candidate.siteId}/overview` : undefined,
    disabled: !candidate.isSynced,
    icon: candidate.isSynced ? undefined : 'i-ph-circle-x-duotone',
    avatar: candidate.isSynced
      ? {
          text: label,
          src: `/_favicon?domain=${withoutTrailingSlash(label)}`,
        }
      : undefined,
  }
}))

const overviewLinks = computed<NavigationMenuItem[]>(() => [
  { label: 'Overview', icon: 'i-ph-chart-bar-duotone', to: '/dashboard' },
])

const domains = computed(() => {
  if (!site.value)
    return []
  return sites.value.filter(candidate => candidate.property === site.value!.property)
})

const domainMenuItems = computed<DropdownMenuItem[]>(() => domains.value.map(candidate => ({
  label: siteLabel(candidate),
  to: `/dashboard/site/${candidate.siteId}/overview`,
})))

const siteSwitcherItems = computed<DropdownMenuItem[]>(() => sites.value.map((candidate) => {
  const label = siteLabel(candidate)
  return {
    label,
    avatar: {
      text: label,
      src: `/_favicon?domain=${withoutTrailingSlash(label)}`,
    },
    onSelect: () => changeSite(candidate.siteId),
  }
}))

function changeSite(siteId: number | string) {
  const childSegment = route.path.split('/').pop()
  return navigateTo(`/dashboard/site/${siteId}/${childSegment}`)
}

const groups = [{ id: 'links', label: 'Go to', items: [] }]
</script>

<template>
  <DashboardShell content-class="p-0">
    <template #brand>
      <NuxtLink to="/dashboard" class="inline-flex min-h-11 items-center rounded-md text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <OgBrand :size="26" wordmark semantic />
      </NuxtLink>
    </template>

    <template #mobileNav>
      <div class="flex min-w-0 items-center justify-between gap-3">
        <div class="min-w-0">
          <div v-if="site" class="truncate text-sm font-medium text-highlighted">
            {{ siteLabel(site) }}
          </div>
          <div v-else class="truncate font-title text-base font-semibold tracking-tight text-highlighted">
            Request Indexing
          </div>
        </div>
        <DashboardHeader :toggle="false" />
      </div>
    </template>

    <template #sidebar>
      <template v-if="site">
        <UDropdownMenu :items="siteSwitcherItems" :content="{ align: 'start' }" class="w-full">
          <UButton color="neutral" variant="ghost" class="min-h-11 w-full justify-between" trailing-icon="i-heroicons-chevron-down-20-solid">
            <div class="flex min-w-0 items-center gap-2">
              <SiteFavicon :site="site" />
              <span class="truncate">{{ siteLabel(site) }}</span>
            </div>
          </UButton>
        </UDropdownMenu>

        <UButton icon="i-ph-arrow-u-down-left" color="neutral" variant="ghost" size="sm" to="/dashboard" class="min-h-10 justify-start">
          Back
        </UButton>

        <UDropdownMenu v-if="domains.length >= 2 && site.property.includes('sc-domain:')" :items="domainMenuItems">
          <UButton size="sm" color="neutral" variant="outline" class="w-full justify-between">
            {{ domains.length }} Sites In Property
          </UButton>
        </UDropdownMenu>

        <div>
          <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Dashboards
          </div>
          <UNavigationMenu orientation="vertical" :items="dashboards" />
        </div>

        <div>
          <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Site
          </div>
          <UNavigationMenu orientation="vertical" :items="siteLinks" />
        </div>

        <div class="mt-auto">
          <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Settings
          </div>
          <UNavigationMenu orientation="vertical" :items="apiLinks" />
        </div>
      </template>

      <template v-else>
        <UNavigationMenu orientation="vertical" :items="overviewLinks" />

        <div>
          <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Team Sites
          </div>
          <UNavigationMenu orientation="vertical" :items="onlySiteLinks" />
        </div>

        <div class="mt-auto">
          <div class="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Team Settings
          </div>
          <UNavigationMenu orientation="vertical" :items="teamLinks" />
        </div>
      </template>
    </template>

    <template #footer>
      <div v-if="session?.team" class="flex min-w-0 items-center gap-2 px-2">
        <UAvatar
          :src="session.user?.avatarUrl || undefined"
          :alt="session.user?.name || session.user?.email || 'Account'"
          size="xs"
        />
        <div class="min-w-0">
          <div class="truncate text-xs text-muted">
            Team
          </div>
          <div class="truncate text-sm font-medium text-highlighted">
            {{ session.team.name }}
          </div>
        </div>
      </div>
    </template>

    <header class="sticky top-0 z-20 border-b border-default bg-default/85 backdrop-blur-sm">
      <div class="dashboard-container flex min-h-16 items-center justify-between gap-4">
        <div class="flex min-w-0 items-center gap-2">
          <template v-if="site">
            <span class="hidden truncate text-lg font-medium text-muted sm:block">{{ siteLabel(site) }}</span>
            <span class="hidden text-muted sm:block" aria-hidden="true">/</span>
          </template>
          <h1 class="flex min-w-0 items-center gap-2 font-title text-xl font-semibold tracking-tight text-highlighted">
            <UIcon v-if="pageIcon" :name="pageIcon" class="size-5 shrink-0 text-primary" aria-hidden="true" />
            <span class="truncate">{{ pageTitle }}</span>
          </h1>
        </div>
        <div class="hidden lg:block">
          <DashboardHeader :toggle="false" />
        </div>
      </div>
    </header>

    <div class="dashboard-container py-6 lg:py-8">
      <slot />
    </div>

    <template #extras>
      <ClientOnly>
        <LazyUDashboardSearch :groups="groups" />
      </ClientOnly>
    </template>
  </DashboardShell>
</template>
