<script setup lang="ts">
// The one dashboard shell. Every `/pro/dashboard/**` page renders through it
// (the pro-shell module assigns this layout in `pages:extend`, so a page in a
// feature layer does not have to remember to).
//
// Sidebar bodies follow nuxtseo.com: the SAME component goes into `#sidebar`
// and `#mobile`, so the desktop rail and the drawer cannot diverge. Scope
// decides which body, not which shell: a Site in the route, or an account with
// exactly one Site, gets the Site nav; anything wider gets the fleet roster.
import type { ProNavSite } from '#layers/pro-shell/app/composables/useProSingleSiteNav'
import { fetchSites } from '~~/layers/core/app/composables/fetch'

const route = useRoute()
const { session } = useUserSession()

const { data: siteData, status: sitesStatus } = await fetchSites()
const sites = computed<ProNavSite[]>(() => (siteData.value?.sites ?? []) as ProNavSite[])
const sitesLoading = computed(() => sitesStatus.value === 'pending')

const routeSiteId = computed(() => typeof route.params.id === 'string' ? route.params.id : null)

/**
 * The Site the sidebar is scoped to, or `null` for the fleet.
 *
 * A Site in the route always wins, even before the roster arrives: the sidebar
 * would otherwise render the fleet list for a beat on every deep link and then
 * swap under the reader's cursor. An account with a single Site collapses to
 * the same body, so the sidebar never flips when crossing shells.
 */
const scopedSite = computed<ProNavSite | null>(() => {
  const id = routeSiteId.value
  if (id)
    return sites.value.find(site => (site.publicId ?? site.siteId ?? site.id) === id) ?? { publicId: id }
  return sites.value.length === 1 ? sites.value[0]! : null
})

/**
 * The dashboard's one `h1`, rendered here rather than in twenty pages.
 *
 * Every `/pro/dashboard/**` page already declares its name through
 * `definePageMeta({ title })`, so the shell can name the page without a per-page
 * header component. A page that folds its heading into a richer identity block
 * (the query and page drill-ins) sets `proOwnHeading` and this steps aside, so
 * no route ever ships two `h1`s.
 */
const ownsHeading = computed(() => (route.meta as { proOwnHeading?: boolean }).proOwnHeading === true)
const pageTitle = computed(() => {
  if (ownsHeading.value)
    return null
  const title = route.meta.subTitle ?? route.meta.title
  return typeof title === 'string' && title ? title : null
})
const pageDescription = computed(() => typeof route.meta.description === 'string' ? route.meta.description : null)
const pageIcon = computed(() => typeof route.meta.icon === 'string' ? route.meta.icon : undefined)

const userMenuItems = computed(() => [
  [{ label: 'Account', icon: 'i-lucide-user', to: '/pro/dashboard/account' }],
  [{ label: 'Sign out', icon: 'i-lucide-log-out', color: 'error' as const, to: '/auth/logout', external: true }],
])
</script>

<template>
  <UiAppShell content-class="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
    <template #brand>
      <NuxtLink
        to="/pro/dashboard"
        class="inline-flex min-h-11 items-center rounded-md text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-h-0"
      >
        <OgBrand :size="26" wordmark semantic />
      </NuxtLink>
    </template>

    <template #sidebar>
      <ProSingleSiteSidebarNav v-if="scopedSite" :site="scopedSite" />
      <ProFleetSidebarNav v-else :sites="sites" :loading="sitesLoading" />
    </template>

    <template #mobileNav>
      <NuxtLink to="/pro/dashboard" class="inline-flex min-h-11 items-center rounded-md text-default">
        <OgBrand :size="22" wordmark semantic />
      </NuxtLink>
    </template>

    <template #mobile="{ closeNav }">
      <div class="mb-4">
        <NuxtLink to="/pro/dashboard" class="inline-flex min-h-11 items-center rounded-md text-default" @click="closeNav">
          <OgBrand :size="24" wordmark semantic />
        </NuxtLink>
      </div>
      <ProSingleSiteSidebarNav v-if="scopedSite" :site="scopedSite" @navigate="closeNav" />
      <ProFleetSidebarNav v-else :sites="sites" :loading="sitesLoading" @navigate="closeNav" />
    </template>

    <template #footer>
      <div class="flex items-center gap-1">
        <UDropdownMenu
          :items="userMenuItems"
          :content="{ side: 'right', align: 'end' }"
          :ui="{ content: 'min-w-48' }"
          class="min-w-0 flex-1"
        >
          <button class="flex w-full min-h-11 items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-elevated lg:min-h-0">
            <UAvatar
              :src="session?.user?.avatarUrl ?? undefined"
              :alt="session?.user?.name ?? undefined"
              size="xs"
            />
            <span class="min-w-0 flex-1 truncate text-left text-sm font-medium text-default">
              {{ session?.user?.name ?? 'Account' }}
            </span>
            <UIcon name="i-lucide-chevrons-up-down" class="size-3.5 shrink-0 text-dimmed" aria-hidden="true" />
          </button>
        </UDropdownMenu>
        <UColorModeButton size="xs" variant="ghost" color="neutral" class="shrink-0" />
      </div>
    </template>

    <header v-if="pageTitle" class="mb-6">
      <h1 class="flex min-w-0 items-center gap-2 font-title text-xl font-semibold tracking-tight text-highlighted">
        <UIcon v-if="pageIcon" :name="pageIcon" class="size-5 shrink-0 text-primary" aria-hidden="true" />
        <span class="truncate">{{ pageTitle }}</span>
      </h1>
      <p v-if="pageDescription" class="mt-1 text-sm text-muted">
        {{ pageDescription }}
      </p>
    </header>

    <slot />
  </UiAppShell>
</template>
