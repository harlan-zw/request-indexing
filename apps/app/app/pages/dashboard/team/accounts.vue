<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
  title: 'Google Accounts',
  icon: 'i-ph-user-circle-duotone',
  description: 'Manage the Google Accounts linked to this team.',
})

const { data: members } = useFetch('/api/teams/members')

const rows = computed(() => {
  return (members.value || []).map((member) => {
    return {
      user: member.user.name,
      avatar: member.user.avatar,
      email: member.user.email,
      role: member.role.replace(/\b\w/g, (c: string) => c.toUpperCase()),
    }
  })
})
</script>

<template>
  <div class="max-w-3xl">
    <h2 class="mb-4 font-bold text-xl">
      Google Accounts
    </h2>
    <UTable :data="rows">
      <template #user-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.avatar ?? undefined" />
          <div>
            <div>{{ row.original.user }}</div>
            <div class="text-gray-400 text-xs">
              {{ row.original.email }}
            </div>
          </div>
        </div>
      </template>
    </UTable>
  </div>
</template>
