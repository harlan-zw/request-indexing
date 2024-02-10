<script setup lang="ts">
definePageMeta({
  layout: 'account',
})

const { fetch } = useUserSession()
const user = useAuthenticatedUser()
const logout = createLogoutHandler()

const toast = useToast()
const isRevokingIndexingAuth = ref(false)
const isDeletingAccount = ref(false)
async function revokeIndexingAuth() {
  isRevokingIndexingAuth.value = true
  await $fetch('/api/indexing/auth', {
    method: 'DELETE',
    headers: {
      Accept: 'text/json',
    },
  })
    .finally(() => {
      isRevokingIndexingAuth.value = false
    })
    .then(() => {
      setTimeout(() => {
        toast.add({ title: 'Google Token Revoked', description: 'You have revoked access to the Web Indexing API.', color: 'green' })
        fetch()
      }, 500) // make sure user knows we actually did something (it's too quick)
    }).catch(() => {
      toast.add({ title: 'Failed to revoke Google Token', description: 'Sorry about that, maybe try again later.', color: 'red' })
    })
}

function deleteAccount() {
  // /api/user/me DELETE
  isDeletingAccount.value = true
  $fetch('/api/user/me', {
    method: 'DELETE',
    headers: {
      Accept: 'text/json',
    },
  }).finally(() => {
    setTimeout(() => {
      toast.add({ id: 'logout', title: 'Account Deleted', description: 'Your account has been deleted.', color: 'green' })
      isDeletingAccount.value = false
      logout()
    }, 500) // make sure user knows we actually did something (it's too quick)
  }).catch(() => {
    toast.add({ title: 'Failed to delete account', description: 'Sorry about that, maybe try again later.', color: 'red' })
  })
}
</script>

<template>
  <div>
    <UPageHeader title="Account" description="Update your details." :links="[]" headline="Your Account" />
    <UPageBody>
      <div>
        <div class="mt-10 mb-5">
          <h2 class="text-lg font-bold mb-1">
            <UIcon name="i-heroicons-lock-closed" class="mr-1.5" />
            Web Indexing API
          </h2>
        </div>
        <template v-if="user.indexingOAuthId">
          <p class="text-gray-600 mb-3">
            You have provided authenticated access to the Web Indexing API. You
            can safely revoke access at any time.
          </p>
          <UButton color="red" variant="soft" :loading="isRevokingIndexingAuth" @click="revokeIndexingAuth">
            Revoke Tokens
          </UButton>
        </template>
        <template v-else>
          <p class="text-gray-600 mb-3">
            You have not provided authenticated access to the Web Indexing API. You
            can provide access when requesting indexing.
          </p>
        </template>
      </div>
      <div>
        <div class="mt-10 mb-5">
          <h2 class="text-lg font-bold mb-1">
            <UIcon name="i-heroicons-trash" class="mr-1.5" />
            Delete Account
          </h2>
        </div>
        <p class=" text-gray-600 mb-2">
          Delete all data associated with your account.
        </p>
        <ul class="mb-3 text-sm text-gray-600 list-disc ml-5">
          <li>Any cached / permanently stored data related to your account will be deleted.</li>
          <li>Your Google Account Tokens will be revoked.</li>
        </ul>
        <UButton color="red" variant="outline" :loading="isDeletingAccount" @click="deleteAccount">
          Delete Account
        </UButton>
      </div>
    </UPageBody>
  </div>
</template>
