<script setup lang="ts">
const categories = [
  {
    label: 'Fundamentals',
    description: 'Learn the API basics',
    color: 'primary',
    items: [
      { label: 'Complete Guide', icon: 'i-heroicons-book-open', to: '/google-indexing-api', description: 'Everything about the Indexing API' },
      { label: 'Setup Tutorial', icon: 'i-heroicons-academic-cap', to: '/google-indexing-api-tutorial', description: 'Step-by-step from scratch' },
      { label: 'Quota & Limits', icon: 'i-heroicons-chart-bar', to: '/google-indexing-api-quota', description: 'Rate limits & strategies' },
    ],
  },
  {
    label: 'How-To Guides',
    description: 'Practical implementations',
    color: 'emerald',
    items: [
      { label: 'Node.js Implementation', icon: 'i-simple-icons-nodedotjs', to: '/google-indexing-api-node-js', description: 'TypeScript & Node.js code' },
      { label: 'Bulk Submit URLs', icon: 'i-heroicons-arrow-up-tray', to: '/bulk-submit-urls-google-indexing-api', description: 'Submit hundreds of URLs' },
      { label: 'For Blog Posts', icon: 'i-heroicons-document-text', to: '/indexing-api-for-blog-posts', description: 'Index blog content faster' },
    ],
  },
]

const colorClasses: Record<string, { dot: string, iconBg: string, icon: string, hover: string }> = {
  primary: {
    dot: 'bg-primary-500',
    iconBg: 'bg-primary-500/10 dark:bg-primary-500/15',
    icon: 'text-primary-600 dark:text-primary-400',
    hover: 'hover:bg-primary-500/5 dark:hover:bg-primary-500/10',
  },
  emerald: {
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    icon: 'text-emerald-600 dark:text-emerald-400',
    hover: 'hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10',
  },
}
</script>

<template>
  <div class="guides-menu grid grid-cols-2 gap-0 p-0 min-w-[520px]">
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
          class="guides-item group flex items-start gap-2.5 px-2 py-2 rounded-lg transition-all duration-200"
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
        to="/guides"
        class="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] transition-colors group"
      >
        <UIcon name="i-heroicons-academic-cap" class="w-4 h-4" />
        <span>Browse all guides</span>
        <UIcon
          name="i-heroicons-arrow-right"
          class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
        />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.guides-menu {
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

.guides-item {
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
