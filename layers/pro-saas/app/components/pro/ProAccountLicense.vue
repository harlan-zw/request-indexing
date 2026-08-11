<script setup lang="ts">
defineProps<{
  session: { subscriptionStatus?: string | null }
}>()
const emit = defineEmits<{ refresh: [] }>()
const proFetch = useProFetch()
const stripeEmail = ref('')
const linkError = ref('')
const linking = ref(false)

function linkStripe() {
  linkError.value = ''
  linking.value = true
  proFetch('/api/pro/link-stripe', {
    method: 'POST',
    body: { email: stripeEmail.value },
  })
    .then(() => emit('refresh'))
    .catch((error: unknown) => {
      const data = typeof error === 'object' && error !== null && 'data' in error ? error.data : undefined
      linkError.value = typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
        ? data.message
        : 'Failed to link account'
    })
    .finally(() => { linking.value = false })
}

const makingPro = ref(false)
function devMakePro() {
  makingPro.value = true
  proFetch('/api/pro/dev-make-pro', { method: 'POST' })
    .then(() => emit('refresh'))
    .finally(() => { makingPro.value = false })
}
</script>

<template>
  <ProCard
    variant="subtle"
    :title="session.subscriptionStatus ? 'License' : 'No active license linked'"
    description="Use your license key in production to verify your Pro status."
  >
    <div v-if="!session.subscriptionStatus" class="mb-4">
      <p class="text-sm text-muted mb-3">
        Already purchased? Enter the email used for payment to activate your key.
      </p>
      <form class="flex gap-2" @submit.prevent="linkStripe">
        <UInput
          v-model="stripeEmail"
          type="email"
          placeholder="your@email.com"
          required
          class="flex-1"
        />
        <UButton type="submit" :loading="linking">
          Link
        </UButton>
      </form>
      <p v-if="linkError" class="text-sm text-error mt-2">
        {{ linkError }}
      </p>
      <DevOnly>
        <UButton class="mt-3" color="warning" :loading="makingPro" @click="devMakePro">
          Dev: Make Pro
        </UButton>
      </DevOnly>
    </div>

    <NuxtSeoProLicenseBox />
  </ProCard>
</template>
