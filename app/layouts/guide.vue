<script lang="ts" setup>
const route = useRoute()

const { data: navigation } = await useAsyncData('guides-nav', () => queryCollectionNavigation('guides'), {
  default: () => [],
})

const navItems = computed(() => {
  return navigation.value?.[0]?.children || navigation.value || []
})

function isActive(path: string) {
  return route.path === path
}

const breadcrumbs = useBreadcrumbItems()
</script>

<template>
  <div>
    <UMain class="relative mb-20 px-5">
      <!-- Ambient glow -->
      <div class="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-green-500/[0.07] to-transparent pointer-events-none" />
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gradient-to-r from-transparent via-green-500/40 to-transparent" />

      <div class="max-w-[1400px] mx-auto lg:pt-5 relative">
        <UPage :ui="{ left: 'lg:col-span-3 xl:col-span-2', center: 'col-span-5 lg:col-span-7 xl:col-span-8' }">
          <template #left>
            <UPageAside class="max-w-[280px]">
              <div class="flex flex-col pt-4">
                <!-- Header -->
                <div class="flex items-center gap-2 mb-4 px-1">
                  <UIcon name="i-heroicons-book-open" class="size-4 text-green-500" />
                  <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">Google Indexing Guides</span>
                </div>

                <!-- Navigation -->
                <nav aria-label="Guide Navigation" class="space-y-1">
                  <NuxtLink
                    v-for="item in navItems"
                    :key="item.path"
                    :to="item.path"
                    class="group relative flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-all duration-150"
                    :class="[
                      isActive(item.path)
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400 font-medium'
                        : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)] hover:bg-[var(--ui-bg-elevated)]/50',
                    ]"
                  >
                    <UIcon
                      :name="item.icon || 'i-heroicons-document-text'"
                      class="size-3.5 flex-shrink-0 transition-colors"
                      :class="isActive(item.path) ? 'text-green-500' : 'text-[var(--ui-text-dimmed)] group-hover:text-green-500/70'"
                    />
                    <span class="text-[13px]">{{ item.title }}</span>
                  </NuxtLink>
                </nav>
              </div>
            </UPageAside>
          </template>

          <UBreadcrumb :items="breadcrumbs" class="mt-10" />

          <slot />
        </UPage>
      </div>
    </UMain>
  </div>
</template>
