<script setup lang="ts">
/**
 * Workspace switcher (Vercel-style pattern).
 *
 * Replaces the legacy combined team+site dropdown. This widget is *only* about
 * the active team — site picking lives in `pro-site-dashboard.vue`'s site
 * switcher. Mid-site-route switches still confirm because the destination team
 * usually doesn't own the current site.
 */

const { teams, currentTeam, isSolo, teamLabel, teamRoleLabel, switchTeam: switchCurrentTeam } = useCurrentWorkspace()
const route = useRoute()
const toast = useToast()

const open = ref(false)
const search = ref('')

const groupedTeams = computed(() => {
  const q = search.value.trim().toLowerCase()
  const filter = (t: { name: string, personalTeam: boolean }) =>
    !q || teamLabel(t).toLowerCase().includes(q)

  return {
    personal: teams.value.filter(t => t.personalTeam && filter(t)),
    shared: teams.value.filter(t => !t.personalTeam && filter(t)),
  }
})

const hasResults = computed(() =>
  groupedTeams.value.personal.length > 0 || groupedTeams.value.shared.length > 0,
)

watch(open, (isOpen) => {
  if (!isOpen)
    search.value = ''
})

const switchModalOpen = ref(false)
const pendingTeamId = ref<number | null>(null)

async function switchTeam(teamId: number) {
  if (teamId === currentTeam.value?.id) {
    open.value = false
    return
  }
  if (route.params.id) {
    pendingTeamId.value = teamId
    open.value = false
    switchModalOpen.value = true
    return
  }
  await doSwitch(teamId)
}

async function doSwitch(teamId: number) {
  try {
    const target = await switchCurrentTeam(teamId)
    open.value = false
    toast.add({
      title: `Switched to ${target ? teamLabel(target) : 'workspace'}`,
      color: 'success',
    })
    await navigateTo('/pro/dashboard')
  }
  catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not switch team'
    toast.add({ title: 'Switch failed', description: message, color: 'error' })
  }
}

async function confirmSwitch() {
  if (!pendingTeamId.value)
    return
  switchModalOpen.value = false
  await doSwitch(pendingTeamId.value)
  pendingTeamId.value = null
}

function cancelSwitch() {
  switchModalOpen.value = false
  pendingTeamId.value = null
}

const triggerAria = computed(() => {
  if (!currentTeam.value)
    return 'Workspace switcher'
  const name = teamLabel(currentTeam.value)
  return `Workspace switcher, current: ${name}, role ${currentTeam.value.role}`
})
</script>

<template>
  <div v-if="currentTeam">
    <!-- Solo users: static workspace pill, no popover -->
    <div
      v-if="isSolo"
      class="flex items-center gap-2 px-2 py-1.5 rounded-md"
      :aria-label="`Workspace: ${teamLabel(currentTeam)}`"
    >
      <ProTeamAvatar :team="currentTeam" size="sm" />
      <div class="flex-1 min-w-0">
        <p class="text-[13px] font-medium text-default truncate leading-tight">
          {{ teamLabel(currentTeam) }}
        </p>
        <p class="text-[11px] text-dimmed truncate leading-tight">
          Personal workspace
        </p>
      </div>
    </div>

    <!-- Multi-team users: popover -->
    <UPopover
      v-else
      v-model:open="open"
      :ui="{ content: 'w-72 p-0' }"
    >
      <button
        type="button"
        class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md border border-default bg-[var(--ui-bg-elevated)]/50 hover:bg-elevated transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
        :aria-label="triggerAria"
      >
        <ProTeamAvatar :team="currentTeam" size="sm" />
        <div class="flex-1 min-w-0">
          <p class="text-[13px] font-medium text-default truncate leading-tight">
            {{ teamLabel(currentTeam) }}
          </p>
          <p class="text-[11px] text-dimmed truncate leading-tight tabular-nums">
            {{ teams.length }} workspace{{ teams.length === 1 ? '' : 's' }}
          </p>
        </div>
        <UIcon
          name="i-lucide-chevrons-up-down"
          class="size-3.5 text-dimmed shrink-0"
          aria-hidden="true"
        />
      </button>

      <template #content>
        <div role="dialog" aria-label="Switch workspace">
          <!-- Search -->
          <div class="p-2 border-b border-default">
            <div class="relative">
              <UIcon
                name="i-lucide-search"
                class="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-dimmed pointer-events-none"
                aria-hidden="true"
              />
              <input
                v-model="search"
                type="text"
                placeholder="Find workspace…"
                aria-label="Find workspace"
                class="w-full bg-transparent pl-7 pr-2 py-1.5 text-[13px] text-default placeholder:text-dimmed focus:outline-none rounded-md"
              >
            </div>
          </div>

          <!-- Groups -->
          <div class="max-h-72 overflow-y-auto py-1">
            <template v-if="groupedTeams.personal.length">
              <p class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-dimmed">
                Personal
              </p>
              <button
                v-for="t in groupedTeams.personal"
                :key="t.id"
                type="button"
                class="flex items-center gap-2.5 w-full px-2 py-1.5 mx-1 my-0.5 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                :class="t.id === currentTeam.id ? 'bg-accented' : 'hover:bg-elevated'"
                role="option"
                :aria-selected="t.id === currentTeam.id"
                @click="switchTeam(t.id)"
              >
                <ProTeamAvatar :team="t" size="sm" />
                <span class="flex-1 min-w-0">
                  <span class="block text-[13px] font-medium text-default truncate leading-tight">
                    {{ teamLabel(t) }}
                  </span>
                  <span class="block text-[11px] text-dimmed truncate leading-tight">
                    Private workspace
                  </span>
                </span>
                <UIcon
                  v-if="t.id === currentTeam.id"
                  name="i-lucide-check"
                  class="size-3.5 text-primary shrink-0"
                  aria-hidden="true"
                />
              </button>
            </template>

            <template v-if="groupedTeams.shared.length">
              <p class="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-dimmed">
                Teams
              </p>
              <button
                v-for="t in groupedTeams.shared"
                :key="t.id"
                type="button"
                class="flex items-center gap-2.5 w-full px-2 py-1.5 mx-1 my-0.5 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50"
                :class="t.id === currentTeam.id ? 'bg-accented' : 'hover:bg-elevated'"
                role="option"
                :aria-selected="t.id === currentTeam.id"
                @click="switchTeam(t.id)"
              >
                <ProTeamAvatar :team="t" size="sm" />
                <span class="flex-1 min-w-0">
                  <span class="block text-[13px] font-medium text-default truncate leading-tight">
                    {{ teamLabel(t) }}
                  </span>
                  <span class="block text-[11px] text-dimmed truncate leading-tight">
                    {{ teamRoleLabel(t.role) }}
                  </span>
                </span>
                <UIcon
                  v-if="t.id === currentTeam.id"
                  name="i-lucide-check"
                  class="size-3.5 text-primary shrink-0"
                  aria-hidden="true"
                />
              </button>
            </template>

            <div
              v-if="!hasResults"
              class="px-3 py-6 text-center text-[12px] text-dimmed"
            >
              No workspaces match "{{ search }}".
            </div>
          </div>

          <!-- Footer actions -->
          <div class="border-t border-default p-1">
            <NuxtLink
              to="/pro/dashboard/teams/create"
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[13px] text-default hover:bg-elevated transition-colors"
              @click="open = false"
            >
              <UIcon name="i-lucide-plus" class="size-3.5 text-muted" aria-hidden="true" />
              Create team
            </NuxtLink>
            <NuxtLink
              to="/pro/dashboard/teams"
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[13px] text-default hover:bg-elevated transition-colors"
              @click="open = false"
            >
              <UIcon name="i-lucide-settings" class="size-3.5 text-muted" aria-hidden="true" />
              Manage teams
            </NuxtLink>
          </div>
        </div>
      </template>
    </UPopover>

    <UModal v-model:open="switchModalOpen" title="Switch workspace?">
      <template #body>
        <p class="text-sm text-muted">
          Switching workspaces will leave the current site. Any unsaved filters or
          chart state on this page will be lost.
        </p>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton
            variant="ghost"
            color="neutral"
            label="Cancel"
            @click="cancelSwitch"
          />
          <UButton
            color="primary"
            label="Switch workspace"
            @click="confirmSwitch"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
