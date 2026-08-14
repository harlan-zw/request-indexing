<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
  title: 'Members',
  icon: 'i-heroicons-users',
  description: 'Manage your team members.',
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
    <UTable :data="rows">
      <template #user-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.avatar ?? undefined" />
          <div>
            <div>{{ row.original.user }}</div>
            <div class="text-xs text-muted">
              {{ row.original.email }}
            </div>
          </div>
        </div>
      </template>
    </UTable>
  </div>
</template>
