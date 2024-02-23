<script lang="ts" setup>
import type { FormError, FormSubmitEvent } from '#ui/types'

defineProps<{ site: any, siteLoader: any, slug: string }>()

definePageMeta({
  title: 'Keyword Research',
  icon: 'i-heroicons-rocket-launch',
})

const state = reactive({
  keywords: undefined,
})

function validate(state: any): FormError[] {
  const errors = []
  if (!state.keywords)
    errors.push({ path: 'keyword', message: 'Required' })
  return errors
}

const response = ref(null)
async function onSubmit(event: FormSubmitEvent<any>) {
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
