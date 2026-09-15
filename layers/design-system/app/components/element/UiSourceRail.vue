<script setup lang="ts">
import type { SourceLogo } from './UiSourceLogos.vue'
import { UiSourceLogos } from '#components'

// The Source rail: the left column of any "pick a Source, then the thing"
// surface (the Analytics add dialog, the Alert trigger picker). One Source per
// row, wearing the catalogue's mark. A Source that cannot be read here stays
// listed, greyed, with its reason: the rail is where a user learns what
// connecting Bing or an analytics property would buy them. It never decides
// availability itself; the caller passes `reason` from the Site's own state.
export interface SourceRailItem {
  identity: SourceLogo
  /**
   * What to call the Source. Usually the identity's own name; Web Analytics
   * passes its Source name while `identity` carries the linked Provider's
   * logo, because a Source and a Provider are different things (GLOSSARY).
   */
  label: string
  /** Non-null when the Source is listed but cannot be read here. */
  reason: string | null
  /**
   * False hides the reason line under the row (it stays in the title). The
   * caller sets it when several rows share one reason and says it once
   * instead, so the rail does not repeat a sentence four times.
   */
  caption?: boolean
  /** Trailing count, e.g. rows already added or rules on this Source. Empty hides it. */
  count?: number | string | null
}

const { sources, quiet = false } = defineProps<{
  sources: readonly SourceRailItem[]
  /**
   * True while a search spans every Source: the selection is kept but not
   * shown as current, so the rail does not claim a scope the rows ignore.
   */
  quiet?: boolean
}>()
const emit = defineEmits<{ pick: [id: string] }>()
const selected = defineModel<string | null>({ default: null })
function pick(id: string) {
  selected.value = id
  emit('pick', id)
}
</script>

<template>
  <ul class="flex flex-row gap-1 overflow-x-auto sm:flex-col sm:overflow-visible" aria-label="Sources">
    <li v-for="s in sources" :key="s.identity.id">
      <button
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
        :class="[
          s.reason ? 'cursor-not-allowed text-dimmed' : 'text-default hover:bg-elevated',
          !quiet && selected === s.identity.id ? 'bg-elevated text-highlighted' : '',
        ]"
        :disabled="!!s.reason"
        :aria-current="!quiet && selected === s.identity.id ? 'true' : undefined"
        :title="s.reason ?? undefined"
        @click="pick(s.identity.id)"
      >
        <UiSourceLogos :sources="[s.identity]" size="xs" :dither="!!s.reason" />
        <span class="min-w-0 flex-1 truncate">{{ s.label }}</span>
        <span v-if="!s.reason && s.count" class="font-mono text-mini text-dimmed">{{ s.count }}</span>
      </button>
      <p v-if="s.reason && s.caption !== false" class="hidden px-2 pb-1 text-mini text-dimmed sm:block">
        {{ s.reason }}
      </p>
    </li>
  </ul>
</template>
