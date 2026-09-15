<script setup lang="ts">
// The CNAME step Bing requires before it reports anything for a Site.
//
// Ported from nuxtseo.com `app/internal/components/bing/ProBingVerification.vue`,
// minus the DNS-provider deep link (this app stores no provider for a Site).
// The check is a mutation, so it goes through the same ability gate the proxy
// enforces server-side: a read-only member sees the record and cannot run it.
import type { BingConnectionV1 } from '@gscdump/contracts/v1/http'
import { useClipboard, useTimeoutFn } from '@vueuse/core'
import { UiAlert, UiButton } from '#components'
import { useProGscdumpBingVerify } from '#layers/pro-gsc/app/composables/useProGscdump'
import { bingVerificationRequestError } from '#layers/pro-gsc/app/utils/bing-view'
import ProAbilityGate from '#layers/pro-saas/app/components/pro/team/ProAbilityGate.vue'

type VerificationRequired = Extract<BingConnectionV1, { _tag: 'verification-required' }>

const { siteId, connection } = defineProps<{
  siteId: string
  connection: VerificationRequired
}>()

const emit = defineEmits<{ checked: [connection: BingConnectionV1] }>()

const verify = useProGscdumpBingVerify()
const toast = useToast()
const { copy } = useClipboard({ legacy: true })
const copiedField = ref<'name' | 'value' | null>(null)
const checking = ref(false)
const pending = ref(false)
const error = ref<string | null>(null)

const host = computed(() => {
  try {
    return new URL(connection.remoteSiteUrl).host
  }
  catch {
    return connection.remoteSiteUrl
  }
})

const { start: clearCopied } = useTimeoutFn(() => {
  copiedField.value = null
}, 2000, { immediate: false })

function copyField(field: 'name' | 'value', value: string) {
  void copy(value)
  copiedField.value = field
  clearCopied()
}

function checkVerification() {
  checking.value = true
  pending.value = false
  error.value = null
  verify(siteId)
    .then((result) => {
      emit('checked', result)
      if (result._tag === 'connected') {
        toast.add({
          title: 'Bing verified',
          description: `${host.value} is connected. Bing data collection can now start.`,
          color: 'success',
        })
        return
      }
      pending.value = result._tag === 'verification-required'
    })
    .catch((requestError: unknown) => {
      error.value = bingVerificationRequestError(requestError)
    })
    .finally(() => {
      checking.value = false
    })
}
</script>

<template>
  <section data-testid="bing-verification" class="space-y-6 py-2">
    <header class="space-y-2">
      <h2 class="text-xl font-semibold text-highlighted">
        Verify {{ host }} in Bing
      </h2>
      <p class="max-w-2xl text-base text-muted">
        Bing knows about this Site. Add this CNAME record to your DNS, then check verification.
      </p>
    </header>

    <div class="space-y-3">
      <p class="text-sm font-medium text-highlighted">
        1. Add this CNAME record at your DNS provider
      </p>
      <div class="divide-y divide-default rounded-lg border border-default bg-muted text-sm">
        <div class="flex items-center justify-between gap-3 p-3">
          <span class="shrink-0 text-dimmed">Type</span>
          <span class="font-mono text-default">CNAME</span>
        </div>
        <div class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <span class="shrink-0 text-dimmed sm:w-24">Name</span>
          <span class="min-w-0 flex-1 break-all font-mono text-default">{{ connection.verification.name }}</span>
          <UiButton
            size="xs"
            purpose="quiet"
            class="min-h-11 min-w-11 self-end sm:min-h-8 sm:min-w-8 sm:self-auto"
            :icon="copiedField === 'name' ? 'check' : 'copy'"
            :aria-label="copiedField === 'name' ? 'CNAME name copied' : 'Copy CNAME name'"
            @click="copyField('name', connection.verification.name)"
          />
        </div>
        <div class="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <span class="shrink-0 text-dimmed sm:w-24">Value</span>
          <span class="min-w-0 flex-1 break-all font-mono text-default">{{ connection.verification.value }}</span>
          <UiButton
            size="xs"
            purpose="quiet"
            class="min-h-11 min-w-11 self-end sm:min-h-8 sm:min-w-8 sm:self-auto"
            :icon="copiedField === 'value' ? 'check' : 'copy'"
            :aria-label="copiedField === 'value' ? 'CNAME value copied' : 'Copy CNAME value'"
            @click="copyField('value', connection.verification.value)"
          />
        </div>
      </div>
      <p class="text-sm text-dimmed">
        Keep this record in place. DNS changes can take minutes or hours to appear.
      </p>
    </div>

    <div class="space-y-3">
      <div class="space-y-1">
        <p class="text-sm font-medium text-highlighted">
          2. Check Bing verification
        </p>
        <p class="text-sm text-muted">
          If the CNAME is live, ask Bing to confirm this Site.
        </p>
      </div>

      <UiAlert
        v-if="pending"
        status="info"
        title="Bing has not found the CNAME yet"
        description="Keep the record in place. Wait for DNS to update, then check again."
      />
      <UiAlert
        v-if="error"
        status="error"
        title="Bing verification could not be checked"
        :description="error"
      />

      <ProAbilityGate ability="write-data">
        <UiButton
          purpose="cta"
          icon="shield-check"
          class="min-h-11 sm:min-h-9"
          :loading="checking"
          :label="checking ? 'Checking verification' : 'Check verification'"
          @click="checkVerification"
        />
      </ProAbilityGate>
    </div>
  </section>
</template>
