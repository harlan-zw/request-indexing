<script setup lang="ts">
const { currentPeriodEnd, daysRemaining } = defineProps<{
  currentPeriodEnd: Date
  daysRemaining: number
}>()

const emit = defineEmits<{
  openPortal: []
  dismiss: []
}>()

const STORAGE_KEY = 'pro-canceled-banner:dismissed'
const dismissed = ref(false)

onMounted(() => {
  if (sessionStorage.getItem(STORAGE_KEY) === '1') {
    dismissed.value = true
  }
})

function onDismiss() {
  sessionStorage.setItem(STORAGE_KEY, '1')
  dismissed.value = true
  emit('dismiss')
}

const formattedDate = ref('')
function formatDate() {
  if (!import.meta.client)
    return ''
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(currentPeriodEnd)
}
onMounted(() => {
  formattedDate.value = formatDate()
})
watch(() => currentPeriodEnd, () => {
  formattedDate.value = formatDate()
})

const title = computed(() => {
  const d = Math.max(0, daysRemaining)
  const dateText = formattedDate.value || 'period end'
  return `Subscription ends ${dateText} · ${d} ${d === 1 ? 'day' : 'days'} left.`
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
      color="info"
      icon="i-lucide-calendar-clock"
      :title="title"
      description="Reactivate any time before then to keep tracking."
      :dismissible="true"
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
          Reactivate plan
        </UButton>
      </template>
    </ProAlert>
  </Transition>
</template>
