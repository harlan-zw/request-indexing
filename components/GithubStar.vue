<script lang="ts" setup>
import { withBase, withoutBase } from 'ufo'
import { useFetch } from '#imports'

const props = defineProps<{
  repo: string
  raw?: boolean
  to?: string
}>()

const repo = computed(() => {
  // support users providing full github url
  return withoutBase(props.repo, 'https://github.com/')
})
const link = computed(() => {
  return props.to || withBase(repo.value, 'https://github.com/')
})
// pull the stars from the server
const { data } = await useFetch('/api/github/repo', {
  query: {
    repo: repo.value,
  },
  watch: [
    repo,
  ],
  key: `github-stars-${repo.value}`,
}).catch(() => {
  return {
    data: ref({ stars: 0 }),
  }
})

const stars = computed(() => {
  if (props.raw)
    return data.value
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(data.value?.stars || 0)
})
</script>

<template>
  <NuxtLink :to="link" target="_blank" :aria-label="`Star ${repo} on GitHub`">
    <slot :stars="stars">
      <div>{{ stars }}</div>
    </slot>
  </NuxtLink>
</template>
