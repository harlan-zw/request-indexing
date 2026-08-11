<script setup lang="ts">
const props = defineProps<{
  session: { stripeCustomerId?: string | null }
  paymentDetails: {
    currency: string
    amount: string | number
    date?: string | null
    receiptUrl?: string | null
  }
}>()
const proFetch = useProFetch()
const openingPortal = ref(false)

function openBillingPortal() {
  if (!props.session.stripeCustomerId)
    return
  openingPortal.value = true
  proAction(() => proFetch<{ url?: string }>('/api/pro/billing/portal', { method: 'POST' }))
    .then((res) => {
      if (res?.url)
        window.location.href = res.url
    })
    .finally(() => { openingPortal.value = false })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<template>
  <ProCard
    variant="subtle"
    title="Billing"
    description="View your payment history and manage billing details through Stripe."
  >
    <div class="space-y-3 mb-4">
      <div class="flex justify-between text-sm">
        <span class="text-muted">Amount Paid</span>
        <span>{{ paymentDetails.currency }} {{ paymentDetails.amount }}</span>
      </div>
      <div v-if="paymentDetails?.date" class="flex justify-between text-sm">
        <span class="text-muted">Purchase Date</span>
        <span>{{ formatDate(paymentDetails.date) }}</span>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-if="paymentDetails?.receiptUrl"
        :to="paymentDetails.receiptUrl"
        external
        target="_blank"
        variant="subtle"
        color="neutral"
        size="sm"
        icon="i-lucide-receipt"
      >
        View Receipt
      </UButton>
      <UButton
        v-if="session.stripeCustomerId"
        variant="subtle"
        color="neutral"
        size="sm"
        icon="i-lucide-credit-card"
        :loading="openingPortal"
        @click="openBillingPortal"
      >
        Manage Billing
      </UButton>
    </div>
  </ProCard>
</template>
