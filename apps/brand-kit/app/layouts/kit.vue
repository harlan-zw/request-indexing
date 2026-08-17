<script setup lang="ts">
const colorMode = useColorMode()

const sections = [
  { heading: 'Foundation', items: [
    { to: '/kit', label: 'Overview', icon: 'i-lucide-sparkles', exact: true },
    { to: '/kit/colors', label: 'Colors', icon: 'i-lucide-palette' },
    { to: '/kit/typography', label: 'Typography', icon: 'i-lucide-type' },
    { to: '/kit/radius', label: 'Radius & surfaces', icon: 'i-lucide-box-select' },
    { to: '/kit/utilities', label: 'Utilities', icon: 'i-lucide-sparkle' },
  ] },
  { heading: 'Components', items: [
    { to: '/kit/buttons', label: 'Buttons & motion', icon: 'i-lucide-mouse-pointer-click' },
    { to: '/kit/forms', label: 'Forms', icon: 'i-lucide-edit-3' },
    { to: '/kit/feedback', label: 'Feedback', icon: 'i-lucide-message-square' },
    { to: '/kit/elements', label: 'Elements', icon: 'i-lucide-shapes' },
    { to: '/kit/popovers', label: 'Popovers & tooltips', icon: 'i-lucide-message-circle' },
  ] },
  { heading: 'Data', items: [
    { to: '/kit/data-cells', label: 'Table cells', icon: 'i-lucide-grid-3x3' },
    { to: '/kit/tables', label: 'Data tables', icon: 'i-lucide-table' },
    { to: '/kit/async-states', label: 'Async states', icon: 'i-lucide-loader' },
  ] },
  { heading: 'Code', items: [
    { to: '/kit/format', label: 'Formatters', icon: 'i-lucide-hash' },
    { to: '/kit/composables', label: 'Composables', icon: 'i-lucide-function-square' },
    { to: '/kit/icon-colors', label: 'Icon palette', icon: 'i-lucide-circle' },
  ] },
]
</script>

<template>
  <div class="min-h-screen bg-default text-default">
    <div class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">
      <aside class="lg:sticky lg:top-6 self-start space-y-6">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="size-2 rounded-full bg-primary-500 animate-pulse" />
            <span class="text-[10px] uppercase tracking-[0.2em] text-muted font-medium">Brand Kit</span>
          </div>
          <NuxtLink to="/kit" class="font-title text-xl font-bold tracking-tight text-highlighted block leading-none">
            Verdant Console
          </NuxtLink>
          <p class="text-[11px] text-dimmed">
            Design-system showcase
          </p>
        </div>

        <UButton
          :icon="colorMode.value === 'dark' ? 'i-lucide-sun' : 'i-lucide-moon'"
          color="neutral"
          variant="outline"
          size="xs"
          block
          @click="colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'"
        >
          {{ colorMode.value === 'dark' ? 'Light mode' : 'Dark mode' }}
        </UButton>

        <nav class="space-y-5 text-sm">
          <div v-for="group in sections" :key="group.heading" class="space-y-1.5">
            <div class="text-[10px] uppercase tracking-wider text-dimmed font-semibold px-2">
              {{ group.heading }}
            </div>
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :exact-active-class="item.exact ? 'bg-elevated text-highlighted' : undefined"
              active-class="bg-elevated text-highlighted"
              class="flex items-center gap-2 px-2 py-1.5 rounded-md text-muted hover:text-highlighted hover:bg-muted transition-colors"
            >
              <UIcon :name="item.icon" class="size-3.5 opacity-70" />
              {{ item.label }}
            </NuxtLink>
          </div>
        </nav>
      </aside>

      <main class="min-w-0 space-y-10">
        <slot />
      </main>
    </div>
  </div>
</template>
