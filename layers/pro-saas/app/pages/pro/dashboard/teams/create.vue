<script setup lang="ts">
definePageMeta({ layout: 'pro-dashboard' })
useSeoMeta({ title: 'Create team' })

const toast = useToast()
const proFetch = useProFetch()

const name = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

async function submit() {
  if (!name.value.trim() || submitting.value)
    return
  submitting.value = true
  error.value = null
  try {
    const { team } = await proFetch<{ team: { id: number } }>('/api/pro/teams', {
      method: 'POST',
      body: { name: name.value.trim() },
    })
    toast.add({ title: 'Team created', color: 'success' })
    await navigateTo(`/pro/dashboard/teams/${team.id}/settings`)
  }
  catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Could not create team'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Create a team
      </h1>
      <p class="mt-1 text-sm text-muted">
        Shared workspaces let you invite teammates with role-based access.
      </p>
    </div>

    <UCard class="max-w-xl">
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Team name" required>
          <UInput
            v-model="name"
            placeholder="Acme Co"
            :disabled="submitting"
            autofocus
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          icon="i-lucide-alert-triangle"
          :title="error"
        />

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            to="/pro/dashboard/teams"
            variant="ghost"
            color="neutral"
            label="Cancel"
          />
          <UButton
            type="submit"
            color="primary"
            label="Create team"
            :loading="submitting"
            :disabled="!name.trim() || submitting"
          />
        </div>
      </form>
    </UCard>
  </div>
</template>
