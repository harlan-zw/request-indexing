<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Site Settings',
  icon: 'i-heroicons-cog',
})

const toast = useToast()
const confirmOpen = ref(false)
const removing = ref(false)

async function removeSite() {
  removing.value = true
  const result = await $fetch<{ success: boolean }>(`/api/sites/${site.siteId}`, { method: 'DELETE' })
    .then(() => ({ _tag: 'Ok' as const }))
    .catch((error: unknown) => ({ _tag: 'Err' as const, error }))
  removing.value = false

  if (result._tag === 'Err') {
    const e = result.error as { statusMessage?: string, data?: { statusMessage?: string } }
    toast.add({
      title: 'Site could not be removed',
      description: e?.data?.statusMessage || e?.statusMessage || 'Try again in a moment.',
      color: 'error',
    })
    return
  }

  confirmOpen.value = false
  toast.add({ title: 'Site removed', description: `${siteLabel(site)} is no longer connected.`, color: 'success' })
  await navigateTo('/dashboard')
}
</script>

<template>
  <div class="max-w-2xl space-y-7">
    <div>
      <CardTitle>Site</CardTitle>
      <UCard>
        <dl class="space-y-4 text-sm">
          <div>
            <dt class="text-muted">
              Name
            </dt>
            <dd class="font-medium">
              {{ siteLabel(site) }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Search Console property
            </dt>
            <dd class="font-mono text-xs break-all">
              {{ site.property }}
            </dd>
          </div>
          <div>
            <dt class="text-muted">
              Sitemaps
            </dt>
            <dd v-if="site.sitemaps?.length" class="space-y-1 font-mono text-xs break-all">
              <div v-for="sitemap in site.sitemaps" :key="sitemap.path ?? ''">
                {{ sitemap.path }}
              </div>
            </dd>
            <dd v-else class="text-muted">
              None reported by Search Console.
            </dd>
          </div>
        </dl>
      </UCard>
    </div>

    <div>
      <CardTitle>Remove site</CardTitle>
      <UCard :ui="{ root: 'ring-error/30' }">
        <p class="mb-4 text-sm text-muted">
          Removing a site deletes its archived Search Console data and its indexing history. You can connect it again later, but the archive does not come back.
        </p>
        <UButton color="error" variant="soft" @click="confirmOpen = true">
          Remove site
        </UButton>
      </UCard>
    </div>

    <UModal
      v-model:open="confirmOpen"
      title="Remove this site?"
      :description="`${siteLabel(site)} and everything archived for it will be deleted.`"
    >
      <template #footer="{ close }">
        <div class="flex justify-end gap-3">
          <UButton color="neutral" variant="ghost" :disabled="removing" @click="close()">
            Cancel
          </UButton>
          <UButton color="error" :loading="removing" @click="removeSite()">
            Remove site
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
