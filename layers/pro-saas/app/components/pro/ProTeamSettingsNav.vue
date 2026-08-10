<script setup lang="ts">
const props = defineProps<{
  sections: Array<{ id: string, label: string, icon: string }>
}>()

const { activeSection, scrollToSection } = useScrollSpy(
  props.sections,
  { offsetPx: 80, throttleMs: 100 },
)
</script>

<template>
  <!-- Desktop: sticky vertical nav (lg+) -->
  <nav
    class="hidden lg:flex flex-col gap-0.5 sticky top-6 self-start"
    aria-label="Settings sections"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      :class="activeSection === section.id
        ? 'bg-elevated text-primary font-medium'
        : 'text-muted hover:text-default hover:bg-elevated/50'"
      :aria-current="activeSection === section.id ? 'true' : undefined"
      @click="scrollToSection(section.id)"
    >
      <UIcon :name="section.icon" class="size-3.5 shrink-0" aria-hidden="true" />
      {{ section.label }}
    </button>
  </nav>

  <!-- Mobile / md: horizontal scroll-tab strip -->
  <nav
    class="lg:hidden flex gap-1 overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 pb-3 border-b border-default"
    aria-label="Settings sections"
  >
    <button
      v-for="section in sections"
      :key="section.id"
      type="button"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
      :class="activeSection === section.id
        ? 'bg-elevated text-primary font-medium'
        : 'text-muted hover:text-default hover:bg-elevated/50'"
      :aria-current="activeSection === section.id ? 'true' : undefined"
      @click="scrollToSection(section.id)"
    >
      <UIcon :name="section.icon" class="size-3.5 shrink-0" aria-hidden="true" />
      {{ section.label }}
    </button>
  </nav>
</template>
