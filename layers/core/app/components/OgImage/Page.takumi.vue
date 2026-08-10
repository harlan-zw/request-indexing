<script setup lang="ts">
const { title = '', description = '', headline = '' } = defineProps<{
  title?: string
  description?: string
  headline?: string
}>()
</script>

<template>
  <OgLayout>
    <div style="margin-bottom: 56px;">
      <OgBrand :size="56" wordmark />
    </div>

    <div class="flex-1 flex flex-col justify-center" style="gap: 24px; max-width: 960px;">
      <div
        v-if="headline"
        class="flex items-center"
        style="gap: 12px;"
      >
        <div style="width: 32px; height: 3px; background-color: #10b981; border-radius: 9999px;" />
        <div
          class="font-title"
          style="font-size: 22px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #10b981;"
        >
          {{ headline }}
        </div>
      </div>

      <div
        v-if="title"
        class="font-title font-bold"
        style="font-size: 80px; line-height: 1.02; letter-spacing: -0.03em; color: #1c1f0e;"
      >
        {{ title }}
      </div>

      <div
        v-if="description"
        style="font-size: 30px; line-height: 1.4; color: #6b6e54;"
      >
        {{ description }}
      </div>
    </div>
  </OgLayout>
</template>
