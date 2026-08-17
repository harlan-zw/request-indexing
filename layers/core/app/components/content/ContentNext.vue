<script setup lang="ts">
import type { ContentNavigationItem } from '@harlan-zw/comark-content'

interface RelatedPage {
  path: string
  title: string
}

type ContentSurroundLink = ContentNavigationItem & { description?: string }

const props = defineProps<{
  surround?: (ContentSurroundLink | null)[]
  relatedPages?: RelatedPage[]
}>()

const contentSurround = computed(() => props.surround?.filter((link): link is ContentSurroundLink => link !== null) ?? [])
</script>

<template>
  <div class="space-y-8">
    <div v-if="relatedPages?.length" class="space-y-4">
      <h3 class="text-sm font-medium text-[var(--ui-text-muted)]">
        Related
      </h3>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="page in relatedPages"
          :key="page.path"
          :to="page.path"
          variant="subtle"
          color="neutral"
          size="sm"
        >
          {{ page.title }}
        </UButton>
      </div>
    </div>
    <UContentSurround v-if="contentSurround.length" :surround="contentSurround" />
  </div>
</template>
