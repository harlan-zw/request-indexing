<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard',
  title: 'Members',
  icon: 'i-heroicons-user-group',
  description: 'Manage your team members.',
})

const { data: members, status } = await useFetch('/api/teams/members')

interface MemberRow {
  user: string | null
  avatar: string | null
  email: string | null
  role: string
}

const rows = computed<MemberRow[]>(() => (members.value || []).map(member => ({
  user: member.user.name,
  avatar: member.user.avatar,
  email: member.user.email,
  role: member.role.replace(/\b\w/g, (c: string) => c.toUpperCase()),
})))

// Explicit columns: the auto-derived set printed the raw `avatar` URL as its own
// column, which forced a horizontal scrollbar. The avatar renders in the User
// cell instead.
const columns: TableColumn<MemberRow>[] = [
  { accessorKey: 'user', header: 'User' },
  { accessorKey: 'role', header: 'Role' },
]
</script>

<template>
  <div class="space-y-4">
    <UTable :data="rows" :columns="columns" :loading="status === 'pending'">
      <template #user-cell="{ row }">
        <div class="flex items-center gap-2">
          <UAvatar :src="row.original.avatar ?? undefined" :alt="row.original.user ?? row.original.email ?? 'Member'" />
          <div>
            <div>{{ row.original.user }}</div>
            <div class="text-xs text-muted">
              {{ row.original.email }}
            </div>
          </div>
        </div>
      </template>
      <template #role-cell="{ row }">
        <UBadge :color="row.original.role === 'Owner' ? 'primary' : 'neutral'" variant="subtle">
          {{ row.original.role }}
        </UBadge>
      </template>
    </UTable>
  </div>
</template>
