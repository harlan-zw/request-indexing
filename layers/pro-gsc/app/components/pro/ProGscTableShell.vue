<script setup lang="ts">
import ProGscdumpError from './ProGscdumpError.vue'

interface FilterDef {
  key: string
  label: string
  icon: string
  special?: boolean
  tooltip: string
}

const {
  filters = [],
  searchPlaceholder = 'Search...',
  emptyIcon = 'i-lucide-search',
  emptyTitle = 'No results found',
  emptyDefaultDescription = 'Data will appear once Google Search Console syncs',
  itemLabel = 'items',
  searchable = true,
  pagination = true,
  pageSize = 12,
  q,
  page,
} = defineProps<{
  filters?: FilterDef[]
  searchPlaceholder?: string
  emptyIcon?: string
  emptyTitle?: string
  emptyDefaultDescription?: string
  itemLabel?: string
  searchable?: boolean
  pagination?: boolean
  pageSize?: number
  // Table state
  q: string
  filter: string | undefined
  isLoading: boolean
  error: any
  rows: any[]
  total: number
  page: number
  columns: any[]
  tableData: any[]
  hasPrevData?: boolean
  backfillPercent?: number
  warnings?: string[]
}>()

const emit = defineEmits<{
  'update:q': [value: string]
  'update:page': [value: number]
  'toggleFilter': [key: string]
  'retry': []
}>()

const localQ = computed({
  get: () => q,
  set: (v: string) => emit('update:q', v),
})

const localPage = computed({
  get: () => page,
  set: (v: number) => emit('update:page', v),
})

function clearSearch() {
  localQ.value = ''
}
</script>

<template>
  <div data-testid="gsc-table-shell" class="space-y-4">
    <!-- Header with search and filters -->
    <div v-if="searchable || filters.length" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div class="flex items-center gap-1.5 flex-wrap">
        <template v-for="f in filters" :key="f.key">
          <UTooltip :text="f.tooltip" :delay-duration="300">
            <button
              class="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-md border transition-colors duration-150"
              :class="[
                filter === f.key
                  ? 'border-accented bg-elevated text-default'
                  : 'border-transparent text-dimmed hover:text-muted hover:bg-[var(--ui-bg-elevated)]/50',
                f.special && filter !== f.key && 'ring-1 ring-[var(--ui-primary)]/50',
              ]"
              @click="emit('toggleFilter', f.key)"
            >
              <UIcon :name="f.icon" class="size-3.5" />
              <span>{{ f.label }}</span>
            </button>
          </UTooltip>
        </template>
      </div>
      <div v-if="searchable" class="relative">
        <UInput
          v-model="localQ"
          class="w-full sm:w-56"
          :placeholder="searchPlaceholder"
          icon="i-lucide-search"
          autocomplete="off"
          size="sm"
          :ui="{ base: 'transition-[width] duration-200 focus-within:w-72' }"
        >
          <template #trailing>
            <UButton
              v-if="localQ !== ''"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="xs"
              class="rounded-lg"
              @click="clearSearch"
            />
          </template>
        </UInput>
      </div>
    </div>

    <!-- Extra notices slot (e.g. enrichment due) -->
    <slot name="notices" />

    <!-- Data warnings from API (e.g. incomplete date range, auth issues) -->
    <div v-if="!isLoading && warnings?.length" class="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--ui-warning)]/5 border border-[var(--ui-warning)]/20 text-sm text-[var(--ui-warning)]">
      <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0 mt-0.5" />
      <div class="space-y-0.5">
        <p v-for="(w, i) in warnings" :key="i">
          {{ w }}
        </p>
      </div>
    </div>

    <!-- No comparison data notice -->
    <div v-if="!isLoading && hasPrevData === false" class="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated border border-default text-sm text-muted">
      <UIcon name="i-lucide-info" class="size-4 shrink-0" />
      <span>Comparison data unavailable for this period. Historical backfill is {{ backfillPercent || 0 }}% complete.</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="rounded-xl border border-default overflow-hidden">
      <slot name="skeleton">
        <div class="bg-[var(--ui-bg-elevated)]/50 px-5 py-3 border-b border-default">
          <div class="flex gap-8">
            <UiSkeleton class="h-3" :index="0" :base="64" :range="20" />
            <UiSkeleton class="h-3" :index="1" :base="48" :range="16" />
            <UiSkeleton class="h-3" :index="2" :base="56" :range="18" />
            <UiSkeleton class="h-3" :index="3" :base="40" :range="14" />
            <UiSkeleton class="h-3" :index="4" :base="48" :range="16" />
          </div>
        </div>
        <div class="divide-y divide-default">
          <div v-for="i in Math.min(pageSize, 10)" :key="i" class="px-5 py-4 flex items-center gap-6">
            <div class="flex-1 space-y-2">
              <UiSkeleton class="h-4" :index="i" :base="180" :range="80" />
            </div>
            <UiSkeleton class="h-4" :index="i + 10" :base="48" :range="16" />
            <UiSkeleton class="h-4" :index="i + 20" :base="56" :range="18" />
            <UiSkeleton class="h-4" :index="i + 30" :base="40" :range="14" />
            <UiSkeleton class="h-5" :index="i + 40" :base="32" :range="12" />
          </div>
        </div>
      </slot>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="rounded-xl border border-dashed border-default bg-[var(--ui-bg-elevated)]/5">
      <ProGscdumpError :error="error" @retry="$emit('retry')" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!rows.length && !isLoading" data-testid="table-empty-state" class="rounded-xl border border-dashed border-default bg-[var(--ui-bg-elevated)]/5 py-16">
      <div class="text-center max-w-sm mx-auto">
        <div class="inline-flex items-center justify-center size-14 rounded-2xl bg-accented mb-4">
          <UIcon :name="emptyIcon" class="size-7 text-dimmed" />
        </div>
        <h3 class="text-sm font-semibold text-default mb-1">
          {{ emptyTitle }}
        </h3>
        <p class="text-sm text-muted mb-4">
          <template v-if="q">
            No {{ itemLabel }} match "<span class="font-medium text-default">{{ q }}</span>"
          </template>
          <template v-else-if="filter && filter !== 'default'">
            No {{ itemLabel }} match the selected filter
          </template>
          <template v-else>
            {{ emptyDefaultDescription }}
          </template>
        </p>
        <UButton
          v-if="q || (filter && filter !== 'default')"
          size="sm"
          color="neutral"
          variant="soft"
          @click="localQ = ''; filter && emit('toggleFilter', filter)"
        >
          Clear filters
        </UButton>
      </div>
    </div>

    <!-- Data Table -->
    <div v-else class="rounded-xl border border-default overflow-hidden bg-default">
      <UiTable
        :data="tableData"
        :columns="columns"
        :page-size="pageSize"
        row-hover
      />
    </div>

    <!-- Pagination -->
    <div v-if="pagination !== false && total > pageSize" class="flex items-center justify-between gap-4 pt-2">
      <p class="text-sm text-muted">
        <span class="font-medium text-default">{{ useProHumanFriendlyNumber(total) }}</span> {{ itemLabel }} total
      </p>
      <UPagination
        v-model:page="localPage"
        size="sm"
        :items-per-page="pageSize"
        :total="total"
        :sibling-count="1"
      />
    </div>
  </div>
</template>
