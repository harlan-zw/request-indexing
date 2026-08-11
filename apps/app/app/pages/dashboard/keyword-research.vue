<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { SiteSelect } from '#shared/types/database'

defineProps<{ site: SiteSelect, siteLoader: unknown, slug: string }>()

definePageMeta({
  title: 'Keyword Research',
  icon: 'i-heroicons-rocket-launch',
})

interface KeywordResearchForm { keywords: string }

const state = reactive<KeywordResearchForm>({ keywords: '' })

function validate(state: KeywordResearchForm): FormError[] {
  const errors: FormError[] = []
  if (!state.keywords)
    errors.push({ name: 'keywords', message: 'Required' })
  return errors
}

const response = ref<unknown>(null)
async function onSubmit(event: FormSubmitEvent<KeywordResearchForm>) {
  // Do something with data
  response.value = await $fetch(`/api/keywords/history`, {
    method: 'POST',
    body: {
      keywords: event.data.keywords.split('\n'),
    },
  })
  return false
}

useHead({
  title: 'Keyword Research',
})
</script>

<template>
  <UContainer>
    <UPageHeader headline="Your Site">
      <template #title>
        <div class="flex items-center gap-3">
          <UIcon :name="$route.meta.icon" />
          {{ $route.meta.title }}
        </div>
      </template>
      <template #links />
    </UPageHeader>
    <UPageBody>
      <UCard>
        <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
          <UFormGroup label="Keyword" name="keywords">
            <UTextarea v-model="state.keywords" autoresize type="textarea" />
          </UFormGroup>

          <UButton type="submit">
            Submit
          </UButton>
        </UForm>
        <div v-if="response">
          {{ response }}
        </div>
      </UCard>
    </UPageBody>
  </UContainer>
</template>
