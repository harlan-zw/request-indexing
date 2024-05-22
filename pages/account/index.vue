<script setup lang="ts">
import { useFriendlySiteUrl } from '~/composables/formatting'

definePageMeta({
  layout: 'user-dashboard',
  title: 'Accounts',
  icon: 'i-ph-user-circle-duotone',
  description: 'Manage the Google Accounts linked to this team.',
})

const { fetch } = useUserSession()
const user = useAuthenticatedUser()
const { session } = useUserSession()
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
  // /services/user/me DELETE
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
      session.value = null
      logout()
    }, 500) // make sure user knows we actually did something (it's too quick)
  }).catch(() => {
    toast.add({ title: 'Failed to delete account', description: 'Sorry about that, maybe try again later.', color: 'red' })
  })
}

async function showSite(site: string) {
  // save it upstream
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({
      hiddenSites: (user.value.hiddenSites || []).filter(s => s !== site),
    }),
  })
}

const confirmDeleteAccount = ref(false)
</script>

<template>
  <div>
    <div v-if="user.hiddenSites?.length">
      <div class="mb-5">
        <h2 class="text-lg font-bold flex items-center gap-1 mb-1">
          <UIcon name="i-heroicons-eye-slash" class="mr-1.5" />
          Hidden Sites
        </h2>
      </div>
      <p class="text-gray-600 dark:text-gray-300 mb-3">
        Sites you are hiding from your dashboard. You can toggle them at any time.
      </p>
      <ul class="ml-5 space-y-2">
        <li v-for="(site, key) in user.hiddenSites" :key="key">
          <SiteFavicon :site="site" class="mr-1.5 inline-block" />
          {{ useFriendlySiteUrl(site) }}
          <UButton variant="link" color="gray" @click="showSite(site)">
            Unhide
          </UButton>
        </li>
      </ul>
    </div>
    <div>
      <div class="mt-10 mb-5">
        <h2 class="text-lg flex items-center font-bold mb-1">
          <UIcon name="i-heroicons-lock-closed" class="mr-1.5" />
          Web Indexing API
        </h2>
      </div>
      <template v-if="user.indexingOAuthIdNext">
        <p class="text-gray-600 dark:text-gray-300 mb-3">
          You have provided authenticated access to the Web Indexing API. You
          can safely revoke access at any time.
        </p>
        <UButton color="red" variant="soft" :loading="isRevokingIndexingAuth" @click="revokeIndexingAuth">
          Revoke Tokens
        </UButton>
      </template>
      <template v-else>
        <p class="text-gray-600 dark:text-gray-300 mb-3">
          You have not provided authenticated access to the Web Indexing API. You
          can provide access when requesting indexing.
        </p>
      </template>
    </div>
    <div>
      <div class="mt-10 mb-5">
        <h2 class="text-lg flex items-center font-bold mb-1">
          <UIcon name="i-heroicons-trash" class="mr-1.5" />
          Delete Account
        </h2>
      </div>
      <p class=" text-gray-600 dark:text-gray-300 mb-2">
        Delete all data associated with your account.
      </p>
      <ul class="mb-3 text-sm text-gray-600 dark:text-gray-300 list-disc ml-5">
        <li>Any cached / permanently stored data related to your account will be deleted.</li>
        <li>Your Google Account Tokens will be revoked.</li>
      </ul>
      <UButton color="red" variant="outline" :loading="isDeletingAccount" @click="confirmDeleteAccount = true">
        Delete Account
      </UButton>
      <UModal v-model="confirmDeleteAccount">
        <div class="p-4">
          <h2 class="text-lg font-bold mb-3">
            Are you sure?
          </h2>
          <p class="text-gray-600 dark:text-gray-300 mb-3">
            This action is irreversible. All data associated with your account will be deleted.
          </p>
          <UButton color="red" variant="outline" :loading="isDeletingAccount" @click="deleteAccount">
            Delete Account
          </UButton>
        </div>
      </UModal>
    </div>
  </div>
</template>
