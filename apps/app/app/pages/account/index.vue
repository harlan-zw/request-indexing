<script setup lang="ts">
definePageMeta({
  layout: 'user-dashboard',
  title: 'Account',
  icon: 'i-ph-user-circle-duotone',
  description: 'Manage your API key, Web Indexing access and account data.',
})

const { session, fetch } = useUserSession()
const indexingAuth = computed(() => session.value?.googleIndexingAuth)
const logout = createLogoutHandler()
const toast = useToast()
const route = useRoute()

// Identity linking bounces back here with `?notice=` / `?error=` from
// `attachIdentityToCurrentSession`. Without feedback the round trip through
// Google ends in silence, so users re-click "Connect" and hit the conflict path.
const linkNotices: Record<string, { title: string, description: string, color: 'success' | 'warning' | 'error' }> = {
  linked: {
    title: 'Account connected',
    description: 'Your Google account is now linked.',
    color: 'success',
  },
  already_linked: {
    title: 'Already connected',
    description: 'That account was already linked to your profile.',
    color: 'warning',
  },
  link_conflict: {
    title: 'Account in use',
    description: 'That Google account is linked to another user.',
    color: 'error',
  },
}
const linkNotice = computed(() => linkNotices[String(route.query.notice)] ?? linkNotices[String(route.query.error)])
onMounted(() => {
  if (linkNotice.value)
    toast.add(linkNotice.value)
})

// Revoking and deleting are modelled as states rather than booleans so the
// confirmation markup cannot render while the user is still in `idle`.
type RevokeState = { _tag: 'idle' } | { _tag: 'revoking' }
type DeleteState = { _tag: 'idle' } | { _tag: 'confirming' } | { _tag: 'deleting' }

const revokeState = ref<RevokeState>({ _tag: 'idle' })
const deleteState = ref<DeleteState>({ _tag: 'idle' })

// The dialog owns no state of its own: it is a projection of `deleteState`.
// Closing is only allowed while confirming, so an in-flight delete stays visible.
const isConfirmingDelete = computed({
  get: () => deleteState.value._tag !== 'idle',
  set: (open: boolean) => {
    if (!open && deleteState.value._tag === 'confirming')
      deleteState.value = { _tag: 'idle' }
  },
})

async function revokeIndexingAuth() {
  revokeState.value = { _tag: 'revoking' }
  try {
    await $fetch('/api/indexing/auth', {
      method: 'DELETE',
      headers: { Accept: 'text/json' },
    })
    toast.add({
      title: 'Google token revoked',
      description: 'You removed access to the Web Indexing API.',
      color: 'success',
    })
    await fetch()
  }
  catch {
    toast.add({
      title: 'Failed to revoke the Google token',
      description: 'The request failed. Try again later.',
      color: 'error',
    })
  }
  finally {
    revokeState.value = { _tag: 'idle' }
  }
}

async function deleteAccount() {
  deleteState.value = { _tag: 'deleting' }
  try {
    await $fetch('/api/user/me', {
      method: 'DELETE',
      headers: { Accept: 'text/json' },
    })
    toast.add({
      id: 'logout',
      title: 'Account deleted',
      description: 'We deleted your account and all of its data.',
      color: 'success',
    })
    session.value = null
    await logout()
  }
  catch {
    deleteState.value = { _tag: 'idle' }
    toast.add({
      title: 'Failed to delete the account',
      description: 'The request failed. Try again later.',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="space-y-10">
    <ProAccountApiKey />

    <section>
      <h2 class="mb-2 flex items-center gap-1.5 text-lg font-bold">
        <UIcon name="i-heroicons-lock-closed" />
        Web Indexing API
      </h2>
      <template v-if="indexingAuth?.indexingOAuthId">
        <p class="mb-3 text-muted">
          You gave this app access to the Web Indexing API. You can revoke access at any time.
        </p>
        <UButton
          color="error"
          variant="outline"
          :loading="revokeState._tag === 'revoking'"
          @click="revokeIndexingAuth"
        >
          Revoke tokens
        </UButton>
      </template>
      <p v-else class="text-muted">
        This app has no access to the Web Indexing API. Grant access when you request indexing.
      </p>
    </section>

    <section class="rounded-[var(--ui-radius)] border border-error/40 bg-error/5 dark:bg-error/10">
      <div class="flex items-center gap-2 border-b border-error/30 px-4 py-3">
        <UIcon name="i-ph-warning-octagon-duotone" class="size-5 text-error" />
        <h2 class="text-lg font-bold text-error">
          Danger zone
        </h2>
      </div>
      <div class="px-4 py-4">
        <p class="mb-2 text-muted">
          Delete all data linked to your account.
        </p>
        <ul class="mb-4 ml-5 list-disc text-sm text-muted">
          <li>We delete every cached and stored record for your account.</li>
          <li>We revoke your Google account tokens.</li>
        </ul>
        <UButton color="error" @click="deleteState = { _tag: 'confirming' }">
          Delete account
        </UButton>
      </div>
    </section>

    <UModal
      v-model:open="isConfirmingDelete"
      title="Delete your account?"
      description="This action is irreversible. We delete all data linked to your account."
      :dismissible="deleteState._tag === 'confirming'"
    >
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="deleteState._tag === 'deleting'"
            @click="deleteState = { _tag: 'idle' }"
          >
            Cancel
          </UButton>
          <UButton
            color="error"
            :loading="deleteState._tag === 'deleting'"
            @click="deleteAccount"
          >
            Delete account
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
