<script setup lang="ts">
import { useHead } from 'nuxt/app'
import { ClientOnly, UiAtmosphere, UiIcon, ULink } from '#components'
import { useColorMode } from '#imports'
// The focused, full-bleed surface shared by the auth screens (login, sign-up)
// and the onboarding wizard: dashboard-theme scope, a masked dot-grid backdrop,
// and a top-left exit link. No dashboard chrome. The single source of this
// substrate — the pro-auth layout and UiWizardShell both compose it, and the
// brand-kit showcase renders it directly.
//
// Height is the consumer's call (attrs fall through to the root <main>): the
// live pages pass `min-h-screen`; an embedded preview passes a fixed height.
//
//  - align="center" centres a single child both axes (auth card).
//  - align="top" stacks content from the top (wizard column).
//  - exitTo renders a real link; otherwise the exit affordance emits `exit`.
const {
  align = 'center',
  exitLabel = 'Home',
  exitTo,
  exitExternal = false,
  showExit = true,
  as = 'main',
} = defineProps<{
  align?: 'center' | 'top'
  exitLabel?: string
  exitTo?: string
  exitExternal?: boolean
  showExit?: boolean
  /**
   * Root element. Defaults to `main` (the page-level landmark) for the real
   * full-page surfaces. Pass `as="div"` when more than one surface renders on a
   * page (e.g. the brand-kit showcase) to avoid duplicate `<main>` landmarks.
   */
  as?: string
}>()

const emit = defineEmits<{ exit: [] }>()
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// The dashboard palette is keyed on `.dark.dashboard-theme` / `.light.dashboard-theme`
// — BOTH classes on the same element — and the color-mode class only ever lands
// on `<html>`. A `dashboard-theme` that sits on this div alone therefore misses
// every `--ui-bg-*` / `--ui-text-*` override and the surface silently renders on
// the marketing slate palette: in dark that means page background and outline
// controls both resolve to the same near-black, so inputs and buttons vanish.
// Mirror it onto `<html>` whenever this surface IS the page (as="main"); an
// embedded preview (`as="div"`, brand-kit) must not restyle its host page.
if (as === 'main')
  useHead({ htmlAttrs: { class: 'dashboard-theme' } })
</script>

<template>
  <component
    :is="as"
    class="ui-focused dashboard-theme relative overflow-hidden flex flex-col items-center px-4 pb-10"
    :class="[
      align === 'center' ? 'justify-center' : '',
      as === 'main' && showExit ? 'pt-20 sm:pt-10' : 'pt-10',
    ]"
    :data-align="align"
  >
    <UiAtmosphere preset="front-door" />
    <div aria-hidden="true" class="ui-focused-dots pointer-events-none absolute inset-0" />

    <ULink
      v-if="showExit && exitTo"
      :to="exitTo"
      :external="exitExternal"
      class="absolute top-3 left-3 z-10 inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted transition-colors hover:text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md sm:top-5 sm:left-5"
    >
      <UiIcon name="back" class="size-3.5 shrink-0" aria-hidden="true" />
      <span class="leading-none">{{ exitLabel }}</span>
    </ULink>
    <button
      v-else-if="showExit"
      type="button"
      class="absolute top-3 left-3 z-10 inline-flex min-h-11 items-center gap-1 px-2 text-sm text-muted transition-colors hover:text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md sm:top-5 sm:left-5"
      @click="emit('exit')"
    >
      <UiIcon name="back" class="size-3.5 shrink-0" aria-hidden="true" />
      <span class="leading-none">{{ exitLabel }}</span>
    </button>

    <ClientOnly v-if="as === 'main'">
      <button
        type="button"
        class="group/theme absolute top-3 right-3 z-10 inline-flex size-11 items-center justify-center rounded-xl text-muted transition-colors hover:text-highlighted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:top-5 sm:right-5"
        :aria-label="`Switch to ${colorMode.value === 'dark' ? 'light' : 'dark'} mode`"
        :title="`Switch to ${colorMode.value === 'dark' ? 'light' : 'dark'} mode`"
        @click="toggleColorMode"
      >
        <span class="inline-flex size-8 items-center justify-center rounded-lg bg-default/60 ring-1 ring-default backdrop-blur-sm transition-colors group-hover/theme:bg-elevated">
          <UiIcon
            :name="colorMode.value === 'dark' ? 'light' : 'dark'"
            class="size-4"
            aria-hidden="true"
          />
        </span>
      </button>
      <template #fallback>
        <span class="absolute top-3 right-3 size-11 sm:top-5 sm:right-5" aria-hidden="true" />
      </template>
    </ClientOnly>

    <slot />
  </component>
</template>

<style scoped>
.ui-focused-dots {
  background-image: radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--ui-bg-inverted) 8%, transparent) 1px, transparent 0);
  background-size: 28px 28px;
}

.ui-focused[data-align="center"] .ui-focused-dots {
  mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 75%);
}

.ui-focused[data-align="top"] .ui-focused-dots {
  mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 0%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 30%, black 0%, transparent 75%);
}
</style>
