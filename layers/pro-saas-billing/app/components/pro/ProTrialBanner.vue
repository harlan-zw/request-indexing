<script setup lang="ts">
const { daysLeft, trialEndsAt, userTimezone } = defineProps<{
  daysLeft: number
  trialEndsAt: Date
  /** IANA timezone string. Defaults to the browser's resolved zone client-side. */
  userTimezone?: string
}>()

const emit = defineEmits<{
  openPortal: []
  dismiss: []
}>()

type Urgency = 'info' | 'warning' | 'error'
const urgency = computed<Urgency>(() => {
  if (daysLeft >= 8)
    return 'info'
  if (daysLeft >= 4)
    return 'warning'
  return 'error'
})

const dismissible = computed(() => urgency.value !== 'error')
const storageKey = computed(() => `pro-trial-banner:dismissed:${urgency.value}`)
const dismissed = ref(false)

onMounted(() => {
  if (dismissible.value && sessionStorage.getItem(storageKey.value) === '1') {
    dismissed.value = true
  }
})

watch(urgency, () => {
  // Re-check dismissal when urgency tier changes; T-tier escalation is a new signal.
  dismissed.value = dismissible.value && sessionStorage.getItem(storageKey.value) === '1'
})

function onDismiss() {
  if (!dismissible.value)
    return
  sessionStorage.setItem(storageKey.value, '1')
  dismissed.value = true
  emit('dismiss')
}

const formattedEnd = ref<string>('')
function formatEnd() {
  if (!import.meta.client)
    return ''
  const tz = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: tz,
  }).format(trialEndsAt)
}
onMounted(() => {
  formattedEnd.value = formatEnd()
})
watch(() => [trialEndsAt, userTimezone], () => {
  formattedEnd.value = formatEnd()
})

const title = computed(() => {
  if (urgency.value === 'info')
    return '30 days free trial. No card required.'
  if (urgency.value === 'warning')
    return `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left. Add a card to keep tracking.`
  if (daysLeft <= 0)
    return 'Trial ends today. Add a card to continue.'
  return `Trial ends ${formattedEnd.value || 'soon'}.`
})

const icon = computed(() => {
  if (urgency.value === 'error')
    return 'i-lucide-clock-alert'
  if (urgency.value === 'warning')
    return 'i-lucide-alarm-clock'
  return 'i-lucide-sparkles'
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-1"
    leave-active-class="transition-all duration-150 ease-in"
    leave-to-class="opacity-0 -translate-y-1"
  >
    <ProAlert
      v-if="!dismissed"
      :color="urgency"
      :icon="icon"
      :title="title"
      :dismissible="dismissible"
      @dismiss="onDismiss"
    >
      <template #action>
        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          trailing-icon="i-lucide-arrow-right"
          @click="emit('openPortal')"
        >
          Manage subscription
        </UButton>
      </template>
    </ProAlert>
  </Transition>
</template>
