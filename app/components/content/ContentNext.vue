<script setup lang="ts">
interface RelatedPage {
  path: string
  title: string
}

interface SurroundLink {
  _path: string
  title: string
  description?: string
}

defineProps<{
  surround?: (SurroundLink | null)[]
  relatedPages?: RelatedPage[]
}>()
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
    <UContentSurround v-if="surround?.filter(Boolean).length" :surround="surround as any" />
  </div>
</template>
