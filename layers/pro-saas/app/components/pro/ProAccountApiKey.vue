<script setup lang="ts">
// Personal API key surface: masked reveal + copy + rotate.
// Backed by /api/pro/account/api-key/rotate (session-only).

import { useClipboard } from '@vueuse/core'

const { caller } = useCaller()
const toast = useToast()
const { copy, copied } = useClipboard()

const revealed = ref(false)
const rotating = ref(false)
const freshKey = ref<string | null>(null)

const displayKey = computed(() => {
  if (freshKey.value)
    return freshKey.value
  const key = caller.value?.user?.apiKey ?? null
  if (!key)
    return null
  if (revealed.value)
    return key
  return `${key.slice(0, 4)}${'•'.repeat(Math.max(0, key.length - 8))}${key.slice(-4)}`
})

async function rotate() {
  rotating.value = true
  try {
    const res = await $fetch<{ apiKey: string }>('/api/pro/account/api-key/rotate', { method: 'POST' })
    freshKey.value = res.apiKey
    revealed.value = true
    toast.add({ title: 'API key rotated', description: 'Copy and store it now — it will not be shown again in plaintext.', color: 'success' })
  }
  catch (err) {
    toast.add({ title: 'Failed to rotate API key', description: (err as Error).message, color: 'error' })
  }
  finally {
    rotating.value = false
  }
}

async function copyKey() {
  if (!displayKey.value)
    return
  const source = freshKey.value ?? caller.value?.user?.apiKey ?? ''
  if (!source)
    return
  await copy(source)
}

function toggleRevealed() {
  revealed.value = !revealed.value
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-ph-key-duotone" class="text-lg" />
        <h3 class="font-semibold">
          API Key
        </h3>
      </div>
    </template>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
      Use this key in MCP and CLI hosts via the <code class="text-xs">Authorization: Bearer</code> header.
      Treat it like a password.
    </p>
    <div v-if="displayKey" class="flex items-center gap-2">
      <UInput
        :model-value="displayKey"
        readonly
        class="flex-1 font-mono text-xs"
      />
      <UButton
        :icon="revealed ? 'i-ph-eye-slash' : 'i-ph-eye'"
        variant="ghost"
        size="sm"
        :aria-label="revealed ? 'Hide API key' : 'Reveal API key'"
        @click="toggleRevealed"
      />
      <UButton
        :icon="copied ? 'i-ph-check' : 'i-ph-copy'"
        variant="ghost"
        size="sm"
        aria-label="Copy API key"
        @click="copyKey"
      />
    </div>
    <p v-else class="text-sm text-gray-500">
      No API key yet. Rotate to generate one.
    </p>
    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        :loading="rotating"
        icon="i-ph-arrows-clockwise"
        @click="rotate"
      >
        Rotate key
      </UButton>
    </template>
  </UCard>
</template>
