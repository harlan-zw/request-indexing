<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { RelatedFixRow } from './UiRelatedFixes.vue'
import { computed } from 'vue'
import { RailPanel, UiButton, UiChip, UiIcon, UiRelatedFixes, UiSyncDot } from '#components'

export interface ActionRailSuggestion {
  id: string
  action: string
  label: string
  sourceLabel?: string
  icon?: string
}

const {
  rows,
  suggestions,
  to,
  loaded = false,
  failed = false,
  title = 'Do next',
  contextLabel,
  icon = 'sparkle',
  moreCount = 0,
  emptyLabel,
  loadingLabel = 'Checking next actions...',
  errorLabel = 'Could not load next actions.',
  hideWhenEmpty = true,
} = defineProps<{
  rows: RelatedFixRow[]
  suggestions: ActionRailSuggestion[]
  to: RouteLocationRaw
  loaded?: boolean
  failed?: boolean
  title?: string
  contextLabel?: string
  icon?: string
  moreCount?: number
  emptyLabel?: string
  loadingLabel?: string
  errorLabel?: string
  hideWhenEmpty?: boolean
}>()

const emit = defineEmits<{
  select: [row: RelatedFixRow]
  retry: []
}>()

const status = computed(() => failed ? 'error' : loaded ? 'success' : 'pending')
const empty = computed(() => !rows.length && !suggestions.length)
const showViewAll = computed(() => rows.length > 0 || moreCount > 0)
const visibleSuggestionCount = computed(() => Math.min(suggestions.length, 4))
const visibleCount = computed(() => rows.length + visibleSuggestionCount.value)
const totalCount = computed(() => rows.length + suggestions.length + moreCount)
const countLabel = computed(() => {
  if (!totalCount.value)
    return null
  return totalCount.value > visibleCount.value ? `${visibleCount.value}+` : visibleCount.value
})
const showGroupLabels = computed(() => rows.length > 0 && suggestions.length > 0)
</script>

<template>
  <RailPanel
    :title="title"
    :count="countLabel"
    :icon="icon"
    :status="status"
    :empty="empty"
    :empty-label="emptyLabel"
    :loading-label="loadingLabel"
    :error-label="errorLabel"
    :hide-when-empty="hideWhenEmpty"
  >
    <template #meta>
      <UiChip
        v-if="contextLabel"
        purpose="tag"
        size="xs"
        icon="target"
      >
        {{ contextLabel }}
      </UiChip>
      <UiButton
        v-if="showViewAll"
        label="View all"
        size="xs"
        purpose="quiet"
        trailing-icon="next"
        :to="to"
      />
    </template>

    <template #error>
      <div class="px-4 py-6 text-sm text-muted">
        <p>{{ errorLabel }}</p>
        <UiButton label="Retry" icon="refresh" size="xs" purpose="quiet" class="mt-2" @click="emit('retry')" />
      </div>
    </template>

    <div class="space-y-2 p-2">
      <div v-if="rows.length" class="space-y-1">
        <div v-if="showGroupLabels" class="flex items-center gap-2 px-1 pt-0.5">
          <UiChip purpose="count" size="xs" tabular>
            {{ rows.length }}
          </UiChip>
          <span class="text-mini font-medium uppercase text-muted">Queued work</span>
        </div>

        <UiRelatedFixes
          :rows="rows"
          :to="to"
          loaded
          :more-count="moreCount"
          :show-header="false"
          @select="emit('select', $event)"
        />
      </div>

      <div v-if="suggestions.length" class="space-y-1">
        <div v-if="showGroupLabels" class="flex items-center justify-between gap-2 px-1 pt-1">
          <UiSyncDot status="syncing" label="Fresh signals" size="1.5" />
          <UiChip purpose="count" size="xs" tabular>
            {{ suggestions.length }}
          </UiChip>
        </div>

        <ul class="divide-y divide-default overflow-hidden rounded-lg border border-default bg-default/60">
          <li
            v-for="suggestion in suggestions.slice(0, 4)"
            :key="suggestion.id"
            class="flex items-start gap-2.5 px-3 py-2.5"
          >
            <span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-default bg-elevated text-dimmed">
              <UiIcon :name="suggestion.icon ?? 'sparkle'" class="size-3.5" />
            </span>
            <span class="min-w-0 flex-1 space-y-1">
              <span class="block text-sm text-default">
                <span class="font-medium text-highlighted">{{ suggestion.action }}</span>
                <span class="text-muted"> · {{ suggestion.label }}</span>
              </span>
              <UiChip purpose="tag" size="xs" icon="activity">
                {{ suggestion.sourceLabel ?? 'Recent activity' }}
              </UiChip>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </RailPanel>
</template>
