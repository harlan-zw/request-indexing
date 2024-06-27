<script lang="ts" setup>
import { createLogoutHandler } from '~/composables/auth'

const router = useRouter()
const { user, session, loggedIn } = useUserSession()

// const { data } = await fetchSites()
// const sites = computed(() => {
//   return (data.value?.sites || [])
// })

const logout = createLogoutHandler()
const isOnWelcome = computed(() => router.currentRoute.value.path === '/dashboard/team/setup')

// TODO refactor this out to use env
if (!loggedIn.value || user.value?.email !== 'harlan@harlanzw.com')
  navigateTo('/dashboard')

watch(isOnWelcome, (val) => {
  if (!val && !session.value.team.onboardedStep)
    router.push('/dashboard/team/setup')
}, {
  immediate: true,
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

// const site: GoogleSearchConsoleSite = computed(() => {
//   const slug = useRoute().params.slug
//   return (sites.value || []).find(site => site.siteId === slug)
// })

const onlyDashboardLinks = computed(() => [
  {
    label: 'Dashboard',
    icon: 'i-ph-app-window-duotone',
    to: '/admin',
  },
  {
    label: 'Users',
    icon: 'i-ph-user-duotone',
    to: '/admin/users',
  },
  {
    label: 'Sites',
    icon: 'i-ph-app-window-duotone',
    to: '/admin/sites',
  },
  {
    label: 'OAuth Clients',
    icon: 'i-ph-lock-duotone',
    to: '/admin/oauth',
  },
  {
    label: 'Jobs',
    icon: 'i-ph-network-duotone',
    to: '/admin/jobs',
  },
])

// const domains = computed(() => {
//   // show other sites sharing the same site.siteUrl
//   const _domains = sites.value.filter(s => s.property === site.value.property)
//   return [
//     ..._domains.map((d) => {
//       return {
//         label: useFriendlySiteUrl(d.domain),
//         value: d,
//         to: `/dashboard/site/${d.siteId}/overview`,
//       }
//     }),
//   ]
// })

// const route = useRoute()
// function changeSite(siteId) {
//   const childSegment = route.path.split('/').pop()
//   return navigateTo(`/dashboard/site/${siteId}/${childSegment}`)
// }

const groups = [{
  key: 'links',
  label: 'Go to',
  commands: [],
}]
</script>

<template>
  <UDashboardLayout>
    <UDashboardPanel :width="250" :resizable="{ min: 200, max: 400 }" collapsible>
      <UDashboardNavbar>
        <template #center>
          <ULink to="/dashboard" color="gray" size="xs" class="flex items-center gap-2 group mr-10">
            <div class="text-black dark:text-white font-title font-semibold whitespace-nowrap text-xl" style="letter-spacing: -1.5px;">
              Admin
            </div>
          </ULink>
        </template>
      </UDashboardNavbar>

      <UDashboardSidebar>
        <UDashboardSidebarLinks :links="onlyDashboardLinks" />

        <template #footer>
          <UDropdown :items="authDropdownItems" mode="hover" class="flex items-center w-full">
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
            <div class="flex w-full justify-between">
              <div class="flex">
                <UAvatar :src="user.picture" size="sm" />
                <div class="ml-2 text-sm font-bold">
                  {{ user.name }}
                </div>
                <div class="ml-2 flex items-center">
                  <UBadge v-if="user.access === 'pro'" label="Pro" color="purple" variant="subtle" class="ml-0.5" />
                </div>
              </div>
              <UButton
                icon="i-heroicons-chevron-down"
                color="gray"
                size="xs"
                variant="ghost"
              />
            </div>
          </UDropdown>
        </template>
      </UDashboardSidebar>
    </UDashboardPanel>
    <UDashboardPage>
      <UDashboardPanel grow>
        <DashboardHeader />
        <div class="overflow-y-auto py-8 w-full">
          <div class="px-10">
            <slot />
          </div>
        </div>
      </UDashboardPanel>
    </UDashboardPage>

    <ClientOnly>
      <LazyUDashboardSearch :groups="groups" />
    </ClientOnly>
  </UDashboardLayout>
</template>
