<script setup lang="ts">
import type { TocLink } from '@nuxt/content'

defineProps<{
  links: TocLink[]
}>()

const emit = defineEmits(['move'])
const router = useRouter()

function scrollToHeading(id: string) {
  const encodedId = encodeURIComponent(id)
  router.push(`#${encodedId}`)
  emit('move', id)
}
</script>

<template>
  <ul v-if="links?.length" class="space-y-1">
    <li v-for="link in links" :key="link.text" :class="[link.depth === 3 && 'ml-3']">
      <a
        :href="`#${link.id}`"
        class="inline-block text-sm truncate max-w-full text-[var(--ui-text-muted)] transition hover:text-[var(--ui-text-highlighted)]"
        @click.prevent="scrollToHeading(link.id)"
      >
        {{ link.text }}
      </a>
    </li>
  </ul>
</template>
