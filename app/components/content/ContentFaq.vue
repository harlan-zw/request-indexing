<script setup lang="ts">
const props = defineProps<{
  items: { question: string, answer: string }[]
}>()

useSchemaOrg([
  {
    '@type': 'FAQPage',
    'mainEntity': props.items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  },
])

const accordionItems = computed(() => props.items.map(item => ({
  label: item.question,
  content: item.answer,
})))
</script>

<template>
  <div class="not-prose my-8">
    <UAccordion :items="accordionItems" />
  </div>
</template>
