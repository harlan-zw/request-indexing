<script setup lang="ts">
const props = defineProps<{
  session: any
  title?: string
  description?: string
}>()
const emit = defineEmits<{ refresh: [] }>()
const assigningRole = ref(false)
const refreshingDiscord = ref(false)
const unlinkingDiscord = ref(false)
const discordError = ref('')
const toast = useToast()

const discordMenuItems = computed(() => [[
  {
    label: 'Refresh',
    icon: 'i-lucide-refresh-cw',
    loading: refreshingDiscord.value,
    onSelect: refreshDiscord,
  },
  {
    label: 'Unlink',
    icon: 'i-lucide-unlink',
    color: 'error' as const,
    loading: unlinkingDiscord.value,
    onSelect: unlinkDiscord,
  },
]])

function refreshDiscord() {
  discordError.value = ''
  refreshingDiscord.value = true
  $fetch('/api/discord/refresh', { method: 'POST' })
    .then(() => {
      toast.add({ title: 'Discord refreshed', color: 'success' })
      emit('refresh')
    })
    .catch((e) => { discordError.value = e.data?.message || 'Failed to refresh Discord' })
    .finally(() => { refreshingDiscord.value = false })
}

function unlinkDiscord() {
  // eslint-disable-next-line no-alert
  if (!confirm('Unlink your Discord account? Your Pro role will be removed.'))
    return
  discordError.value = ''
  unlinkingDiscord.value = true
  $fetch('/api/discord/unlink', { method: 'POST' })
    .then(() => {
      toast.add({ title: 'Discord unlinked', color: 'success' })
      emit('refresh')
    })
    .catch((e) => { discordError.value = e.data?.message || 'Failed to unlink Discord' })
    .finally(() => { unlinkingDiscord.value = false })
}

const emailEnabled = computed(() => !!props.session?.monthlyReportEmail)
const discordReportEnabled = computed(() => !!props.session?.monthlyReportDiscord)
const enabledChannels = computed(() => {
  const list: string[] = []
  if (emailEnabled.value)
    list.push('Email')
  if (discordReportEnabled.value)
    list.push('Discord')
  return list
})

const { data: gscData } = useLazyFetch('/api/pro/gsc-properties', {
  key: 'pro:gsc-properties',
  immediate: props.session?.gscConnected,
})

const hasScopeError = computed(() => gscData.value?.error?.reason === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT')

function assignDiscordRole() {
  discordError.value = ''
  assigningRole.value = true
  $fetch('/api/discord/assign-role', { method: 'POST' })
    .then(() => emit('refresh'))
    .catch((e) => { discordError.value = e.data?.message || 'Failed to assign role' })
    .finally(() => { assigningRole.value = false })
}
</script>

<template>
  <ProCard variant="subtle" divided :title="title" :description="description">
    <div>
      <!-- Discord -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <UAvatar
            v-if="session.discordAvatar"
            :src="session.discordAvatar"
            :alt="session.discordUsername || 'Discord'"
            size="3xs"
            icon="i-simple-icons-discord"
          />
          <ProNavIcon v-else icon="i-simple-icons-discord" />
          <div>
            <p class="font-medium">
              Discord
            </p>
            <p v-if="session.discordId" class="text-sm text-muted">
              {{ session.discordUsername }}
            </p>
            <p v-else class="text-sm text-muted">
              Get Pro role in our server
            </p>
          </div>
        </div>
        <div v-if="!session.discordId">
          <UButton
            v-if="session.subscriptionStatus"
            to="/api/discord/auth/redirect"
            external
            size="sm"
            color="neutral"
            variant="soft"
          >
            Connect
          </UButton>
          <UBadge v-else color="neutral" variant="outline" size="xs">
            Pro Only
          </UBadge>
        </div>
        <div v-else class="flex items-center gap-2">
          <UBadge v-if="session.discordRoleAssigned" color="success" variant="subtle" size="xs">
            Pro Role
          </UBadge>
          <UButton
            v-else-if="session.subscriptionStatus"
            size="sm"
            color="neutral"
            variant="soft"
            :loading="assigningRole"
            @click="assignDiscordRole"
          >
            Assign Role
          </UButton>
          <UDropdownMenu :items="discordMenuItems" :ui="{ content: 'min-w-36' }">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              size="xs"
              variant="ghost"
              color="neutral"
              aria-label="Discord actions"
            />
          </UDropdownMenu>
        </div>
      </div>
      <p v-if="discordError" class="text-sm text-error pt-2">
        {{ discordError }}
      </p>
    </div>

    <div>
      <!-- Google Search Console -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <ProNavIcon icon="i-simple-icons-google" />
          <div>
            <p class="font-medium">
              Google Search Console
            </p>
            <p v-if="session.gscConnected" class="text-sm text-muted">
              {{ gscData?.gscEmail || session.gscEmail }}
            </p>
            <p v-else class="text-sm text-muted">
              Access search analytics
            </p>
          </div>
        </div>
        <div v-if="!session.gscConnected">
          <UButton
            v-if="session.subscriptionStatus"
            to="/auth/integrations/gsc/connect"
            external
            size="sm"
            color="neutral"
            variant="soft"
          >
            Connect
          </UButton>
          <UBadge v-else color="neutral" variant="outline" size="xs">
            Pro Only
          </UBadge>
        </div>
        <div v-else-if="hasScopeError">
          <UBadge color="warning" variant="subtle" size="xs" class="flex items-center gap-1">
            <UIcon name="i-lucide-alert-triangle" class="size-3" />
            Needs Permission
          </UBadge>
        </div>
        <div v-else>
          <UBadge color="success" variant="subtle" size="xs" class="flex items-center gap-1">
            <div class="size-1.5 rounded-full" :class="semanticColors.success.dot" />
            Connected
          </UBadge>
        </div>
      </div>

      <ProAlert
        v-if="session.gscConnected && hasScopeError"
        class="mt-3 sm:ml-8"
        color="warning"
        icon="i-lucide-shield-alert"
        title="Search Console permission not granted"
      >
        <template #action>
          <UButton
            to="/auth/integrations/gsc/connect"
            external
            color="warning"
            variant="soft"
            size="xs"
          >
            Fix
          </UButton>
        </template>
      </ProAlert>

      <div v-if="session.gscConnected && !hasScopeError" class="mt-3 sm:ml-8">
        <div class="flex items-center gap-3 sm:gap-4 text-sm flex-wrap">
          <div class="flex items-center gap-1.5 text-muted">
            <UIcon name="i-lucide-globe" class="size-3.5 text-dimmed" />
            <span><span class="font-mono tabular-nums">{{ gscData?.stats?.total || 0 }}</span> {{ (gscData?.stats?.total || 0) === 1 ? 'property' : 'properties' }}</span>
          </div>
          <div v-if="gscData?.stats?.synced" class="flex items-center gap-1.5" :class="semanticColors.success.text">
            <UIcon name="i-lucide-check-circle" class="size-3.5" />
            <span><span class="font-mono tabular-nums">{{ gscData.stats.synced }}</span> synced</span>
          </div>
          <div v-if="gscData?.stats?.syncing" class="flex items-center gap-1.5 text-info">
            <UIcon name="i-lucide-loader-2" class="size-3.5 animate-pulse" />
            <span><span class="font-mono tabular-nums">{{ gscData.stats.syncing }}</span> syncing</span>
          </div>
          <div v-if="gscData?.stats?.readyToSync" class="flex items-center gap-1.5 text-primary">
            <UIcon name="i-lucide-zap" class="size-3.5" />
            <span><span class="font-mono tabular-nums">{{ gscData.stats.readyToSync }}</span> ready</span>
          </div>
        </div>
        <div class="mt-3">
          <UButton to="/pro/dashboard/search-console" size="xs" color="primary" variant="soft" trailing-icon="i-lucide-arrow-right">
            Manage
          </UButton>
        </div>
      </div>
    </div>

    <div>
      <!-- Monthly Report (summary + link; full controls live on Reports page) -->
      <div class="flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <ProNavIcon icon="i-lucide-file-text" />
          <div class="min-w-0">
            <p class="font-medium">
              Monthly Report
            </p>
            <p v-if="enabledChannels.length" class="text-sm text-muted">
              Delivered via {{ enabledChannels.join(' & ') }}
            </p>
            <p v-else class="text-sm text-muted">
              No delivery channel enabled
            </p>
          </div>
        </div>
        <UButton
          to="/pro/dashboard/reports"
          size="sm"
          color="neutral"
          variant="soft"
          trailing-icon="i-lucide-arrow-right"
        >
          Manage
        </UButton>
      </div>
    </div>
  </ProCard>
</template>
