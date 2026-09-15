<script setup lang="ts">
// The single-Site sidebar body, rendered by the desktop rail AND the mobile
// drawer so the two cannot diverge. Ported from nuxtseo.com's
// `ProSingleSiteSidebarNav.vue`.
//
// The favicon plus site-name header row IS the Site landing link, which is why
// `useProSingleSiteNav` suppresses the synthesized Overview row.
import type { ProNavSite } from '#layers/pro-shell/app/composables/useProSingleSiteNav'
import { useRoute } from 'nuxt/app'
import { computed } from 'vue'
import { NuxtLink, ProNavSection, UiFavicon, UiNavList } from '#components'
import { useProSingleSiteNav } from '#layers/pro-shell/app/composables/useProSingleSiteNav'

const { site } = defineProps<{ site: ProNavSite }>()

const emit = defineEmits<{ navigate: [] }>()
function onNavigate() {
  emit('navigate')
}

const route = useRoute()
const nav = useProSingleSiteNav(() => site)
const headerActive = computed(() => route.path === nav.siteTo.value)
</script>

<template>
  <!-- flex + min-h-full so the bottom rail (`mt-auto`) pins above the footer
       when the nav is short. -->
  <div class="flex min-h-full flex-col gap-5">
    <div>
      <div class="mb-2 flex items-center justify-between px-1">
        <!-- The header IS the Site landing row, so it renders like one: the
             same raised active surface every UiNavList row gets. -->
        <NuxtLink
          :to="nav.siteTo.value"
          class="flex min-h-11 min-w-0 flex-1 items-center gap-1.5 rounded px-1 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:min-h-0"
          :class="headerActive
            ? 'bg-elevated text-highlighted'
            : 'text-highlighted hover:bg-elevated dark:text-toned dark:hover:text-highlighted'"
          :style="headerActive ? { boxShadow: 'var(--elevation-raised)', backgroundImage: 'var(--surface-raised)' } : undefined"
          :aria-current="headerActive ? 'page' : undefined"
          @click="onNavigate"
        >
          <UiFavicon :domain="nav.siteDomain.value" :size="13" decorative class="shrink-0" />
          <span class="truncate">{{ nav.siteLabel.value }}</span>
        </NuxtLink>
      </div>
      <UiNavList
        v-if="nav.pinnedLinks.value.length"
        variant="sidebar"
        tone="default"
        label="Site"
        :links="nav.pinnedLinks.value"
        @click="onNavigate"
      />
    </div>

    <div class="flex flex-col gap-5">
      <ProNavSection
        v-for="section in nav.sections.value"
        :key="section.id"
        :group-id="section.id"
        :label="section.label"
        :links="section.links"
        @navigate="onNavigate"
      />
    </div>

    <div class="mt-auto border-t border-default pt-3">
      <UiNavList
        variant="sidebar"
        label="Site settings"
        :links="nav.railLinks.value"
        @click="onNavigate"
      />
    </div>
  </div>
</template>
