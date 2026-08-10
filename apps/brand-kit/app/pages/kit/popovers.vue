<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Popovers & Tooltips · Brand Kit' })
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Components"
      title="Popovers & tooltips"
      description="Overlay primitives. Every popover surface inherits the tooltip-grade 5-layer chrome from the design-system layer."
    />

    <KitSection
      title="UiTooltip"
      code="<UiTooltip>"
      description="Reka-ui tooltip primitive — bypasses Nuxt UI's wrapper to avoid hover-flicker in dense grids."
    >
      <UCard variant="outline">
        <div class="flex flex-wrap items-center gap-4">
          <UiTooltip text="A simple tooltip">
            <UButton variant="outline">
              Text only
            </UButton>
          </UiTooltip>
          <UiTooltip title="Indexed" description="34 of 41 pages confirmed by Google in the last 28 days.">
            <UButton variant="outline">
              Title + description
            </UButton>
          </UiTooltip>
          <UiTooltip text="Pinned bottom" side="bottom">
            <UButton variant="outline">
              Side: bottom
            </UButton>
          </UiTooltip>
          <UiTooltip text="Right aligned" side="right">
            <UButton variant="outline">
              Side: right
            </UButton>
          </UiTooltip>
          <UiTooltip label="Hover the (?) for help" />
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="UiPopover"
      code="<UiPopover>"
      description="Click or hover popover. Auto-applies the ui-popover-content chrome."
    >
      <UCard variant="outline">
        <div class="flex flex-wrap items-center gap-4">
          <UiPopover>
            <UButton icon="i-lucide-filter">
              Filters
            </UButton>
            <template #panel>
              <div class="p-4 w-64 space-y-3">
                <div class="text-xs uppercase tracking-wider text-dimmed font-semibold">
                  Status
                </div>
                <div class="space-y-1.5">
                  <UCheckbox label="Indexed" default-value />
                  <UCheckbox label="Submitted" />
                  <UCheckbox label="Excluded" />
                </div>
              </div>
            </template>
          </UiPopover>
          <UiPopover mode="hover" :open-delay="150">
            <UButton variant="outline" icon="i-lucide-mouse-pointer">
              Hover popover
            </UButton>
            <template #panel>
              <div class="p-4 max-w-xs text-sm text-default">
                Hover-triggered popover with a 150ms open delay.
              </div>
            </template>
          </UiPopover>
          <UiPopover :content="{ side: 'right' }" arrow>
            <UButton variant="outline" icon="i-lucide-info">
              With arrow
            </UButton>
            <template #panel>
              <div class="p-3 max-w-xs text-sm text-default">
                Side right + arrow visible.
              </div>
            </template>
          </UiPopover>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="UDropdownMenu" code="<UDropdownMenu>">
      <UCard variant="outline">
        <UDropdownMenu
          :items="[
            [
              { label: 'View site', icon: 'i-lucide-external-link' },
              { label: 'Edit settings', icon: 'i-lucide-settings' },
            ],
            [
              { label: 'Pause indexing', icon: 'i-lucide-pause', kbds: ['meta', 'p'] },
              { label: 'Export CSV', icon: 'i-lucide-download', kbds: ['meta', 'e'] },
            ],
            [
              { label: 'Delete', icon: 'i-lucide-trash', color: 'error' as const },
            ],
          ]"
        >
          <UButton trailing-icon="i-lucide-chevron-down" color="neutral" variant="outline">
            Actions
          </UButton>
        </UDropdownMenu>
      </UCard>
    </KitSection>

    <KitSection title="UModal" code="<UModal>">
      <UCard variant="outline">
        <UModal title="Submit URL for indexing" description="Google will queue this URL for re-crawling.">
          <UButton icon="i-lucide-plus">
            Open modal
          </UButton>
          <template #body>
            <UFormField label="URL">
              <UInput placeholder="https://example.com/post" />
            </UFormField>
          </template>
          <template #footer>
            <UButton color="neutral" variant="outline">
              Cancel
            </UButton>
            <UButton icon="i-lucide-send">
              Submit
            </UButton>
          </template>
        </UModal>
      </UCard>
    </KitSection>
  </div>
</template>
