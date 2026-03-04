<script setup lang="ts">
const categories = [
  {
    label: 'Check URLs',
    description: 'Is your content indexed?',
    color: 'amber',
    items: [
      { label: 'Google Index Checker', icon: 'i-heroicons-magnifying-glass', to: '/tools/google-indexing-checker', description: 'Check if a single URL is indexed' },
      { label: 'Bulk Indexing Checker', icon: 'i-heroicons-queue-list', to: '/tools/bulk-indexing-checker', description: 'Check multiple URLs at once' },
    ],
  },
  {
    label: 'Reports',
    description: 'Site-wide analysis',
    color: 'violet',
    items: [
      { label: 'Site Indexing Report', icon: 'i-heroicons-document-chart-bar', to: '/tools/site-indexing-report', description: 'Full indexing status for your site' },
    ],
  },
]

const colorClasses: Record<string, { dot: string, iconBg: string, icon: string, hover: string }> = {
  amber: {
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-500/10 dark:bg-amber-500/15',
    icon: 'text-amber-600 dark:text-amber-400',
    hover: 'hover:bg-amber-500/5 dark:hover:bg-amber-500/10',
  },
  violet: {
    dot: 'bg-violet-500',
    iconBg: 'bg-violet-500/10 dark:bg-violet-500/15',
    icon: 'text-violet-600 dark:text-violet-400',
    hover: 'hover:bg-violet-500/5 dark:hover:bg-violet-500/10',
  },
}
</script>

<template>
  <div class="tools-menu grid grid-cols-2 gap-0 p-0 min-w-[520px]">
    <div
      v-for="(category, catIdx) in categories"
      :key="category.label"
      class="category-column relative"
      :class="[catIdx < categories.length - 1 ? 'border-r border-[var(--ui-border)]' : '']"
      :style="{ '--stagger': catIdx }"
    >
      <!-- Category header -->
      <div class="px-4 pt-4 pb-2">
        <div class="flex items-center gap-2 mb-0.5">
          <span
            class="w-1.5 h-1.5 rounded-full"
            :class="colorClasses[category.color].dot"
          />
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--ui-text-muted)]">
            {{ category.label }}
          </span>
        </div>
        <p class="text-[10px] text-[var(--ui-text-dimmed)] pl-3.5">
          {{ category.description }}
        </p>
      </div>

      <!-- Items list -->
      <div class="px-2 pb-3 space-y-0.5">
        <NuxtLink
          v-for="(item, itemIdx) in category.items"
          :key="item.to"
          :to="item.to"
          class="tools-item group flex items-start gap-2.5 px-2 py-2 rounded-lg transition-all duration-200"
          :class="colorClasses[category.color].hover"
          :style="{ '--item-delay': itemIdx }"
        >
          <!-- Icon -->
          <div
            class="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
            :class="colorClasses[category.color].iconBg"
          >
            <UIcon
              :name="item.icon"
              class="w-4 h-4 transition-colors"
              :class="colorClasses[category.color].icon"
            />
          </div>

          <!-- Label + description -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1">
              <span class="text-sm font-medium text-[var(--ui-text)] group-hover:text-[var(--ui-text-highlighted)] transition-colors">
                {{ item.label }}
              </span>
              <UIcon
                name="i-heroicons-chevron-right-20-solid"
                class="w-3.5 h-3.5 text-[var(--ui-text-dimmed)] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
              />
            </div>
            <p class="text-[11px] text-[var(--ui-text-dimmed)] leading-tight mt-0.5">
              {{ item.description }}
            </p>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- Footer -->
    <div class="col-span-2 border-t border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]/50">
      <NuxtLink
        to="/tools"
        class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors group"
      >
        <UIcon name="i-heroicons-wrench-screwdriver" class="w-4 h-4" />
        <span>Browse all tools</span>
        <UIcon
          name="i-heroicons-arrow-right"
          class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.tools-menu {
  animation: menu-enter 0.2s ease-out;
}

@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.category-column {
  animation: column-stagger 0.25s ease-out backwards;
  animation-delay: calc(var(--stagger) * 40ms);
}

@keyframes column-stagger {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tools-item {
  animation: item-fade 0.2s ease-out backwards;
  animation-delay: calc(var(--stagger) * 40ms + var(--item-delay) * 30ms + 80ms);
}

@keyframes item-fade {
  from {
    opacity: 0;
    transform: translateX(-6px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
