<script lang="ts" setup>
import type { GoogleSearchConsoleSite } from '~/types'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: GoogleSearchConsoleSite }>()

definePageMeta({
  title: 'Web Indexing',
  icon: 'i-heroicons-check-circle',
})

useHead({
  title: 'Web Indexing',
})

const siteData = useSiteData(props.site)
const { data } = siteData.indexing()
</script>

<template>
  <div>
    <div class="text-sm text-gray-500 ">
      <TableIndexing :value="data" :site="site" />
    </div>
  </div>
<!--      <div> -->
<!--        <div v-if="data?.requiresActionPercent === -1" class="text-lg text-gray-600 dark:text-gray-300 mb-2"> -->
<!--          <UAlert color="yellow" variant="outline" icon="i-heroicons-exclamation-circle" title="Too many URLs"> -->
<!--            <template #description> -->
<!--            <div> -->
<!--              We are unable to calculate the percentage of non-indexed pages due to the large number of -->
<!--              URLs. You can still inspect URLs to see if they are indexed. -->
<!--            </div> -->
<!--            </template> -->
<!--          </UAlert> -->
<!--          <div>Upgrade to Pro to start indexing large sites.</div> -->
<!--          <UButton /> -->
<!--          <TableNonIndexedUrls :value="data?.requiresAction" :site="site" /> -->
<!--        </div> -->
<!--        <div v-else-if="!pending && data?.needsCrawl"> -->
<!--          <div>Missing sitemap, you will need our bots to crawl your site.</div> -->
<!--          <UButton @click="crawl = true"> -->
<!--            Crawl -->
<!--          </UButton> -->
<!--        </div> -->
<!--        <div v-else-if="!pending && !data?.requiresAction.length"> -->
<!--          <div class="text-lg text-gray-600 dark:text-gray-300 mb-2"> -->
<!--            All of your pages are indexed. Congrats! -->
<!--          </div> -->
<!--        </div> -->
<!--        <UCard v-if="site.permissionLevel !== 'siteOwner'"> -->
<!--          <template #header> -->
<!--          <h2 class="text-lg font-bold flex items-center gap-2"> -->
<!--            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5" /> -->
<!--            <span>Invalid Permission</span> -->
<!--          </h2> -->
<!--          </template> -->
<!--          <div class="text-sm mb-4"> -->
<!--            <div class="mb-2"> -->
<!--              You are not the owner of <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="font-mono whitespace-nowrap underline"> -->
<!--              {{ site.domain }} -->
<!--            </NuxtLink> property. You will only be able to view data -->
<!--              and inspect URLs. -->
<!--            </div> -->
<!--            <div> -->
<!--              Please update the permissions in <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="whitespace-nowrap underline"> -->
<!--              Google Search Console -->
<!--            </NuxtLink> to fix this. -->
<!--            </div> -->
<!--          </div> -->
<!--        </UCard> -->
<!--        <UCard v-else-if="user.indexingOAuthId"> -->
<!--          <template #header> -->
<!--          <h2 class="text-xl font-bold"> -->
<!--            Quota -->
<!--          </h2> -->
<!--          <p class="text-sm text-gray-500 dark:text-gray-400"> -->
<!--            You are limited to the number of indexing requests you can make each day. -->
<!--          </p> -->
<!--          </template> -->
<!--          <div class="text-gray-600 dark:text-gray-300"> -->
<!--            <div> -->
<!--              <div class="flex items-center justify-between"> -->
<!--                <div> -->
<!--                  <div class="text-sm"> -->
<!--                    Request Indexing -->
<!--                  </div> -->
<!--                  <div class="text-lg font-bold"> -->
<!--                    {{ user.quota.indexingApi }}/{{ apiCallLimit }} -->
<!--                  </div> -->
<!--                  <UProgress :value="user.quota.indexingApi / apiCallLimit * 100" :color="user.quota.indexingApi < apiCallLimit ? 'purple' : 'red'" class="mt-1" /> -->
<!--                </div> -->
<!--                <UButton to="/account/upgrade" color="purple" size="xs" :variant="user.quota.indexingApi < apiCallLimit ? 'soft' : 'solid'"> -->
<!--                  Upgrade -->
<!--                </UButton> -->
<!--              </div> -->
<!--              <div v-if="user.quota.indexingApi >= apiCallLimit" class="mt-5 text-gray-600 text-sm"> -->
<!--                <p class="mb-2"> -->
<!--                  You've used up all of your API calls for the day. They will reset at midnight PTD. -->
<!--                </p> -->
<!--                <p class="mb-2"> -->
<!--                  Don't feel like waiting? You can upgrade to Pro and get the following: -->
<!--                </p> -->
<!--                <ul class="list-disc ml-5"> -->
<!--                  <li class="mb-2"> -->
<!--                    200 API calls / per day -->
<!--                  </li> -->
<!--                  <li> -->
<!--                    <UBadge color="blue" variant="soft"> -->
<!--                      Soon -->
<!--                    </UBadge> Automatic index requests for new pages -->
<!--                  </li> -->
<!--                </ul> -->
<!--              </div> -->
<!--            </div> -->
<!--          </div> -->
<!--        </UCard> -->
<!--        <UCard v-else> -->
<!--          <template #header> -->
<!--          <h2 class="text-lg font-bold"> -->
<!--            Permissions -->
<!--          </h2> -->
<!--          </template> -->
<!--          <div class="text-sm mb-4"> -->
<!--            <div> -->
<!--              Authorization is required for the <NuxtLink to="/" class="underline"> -->
<!--              Web Indexing API -->
<!--            </NuxtLink>. -->
<!--              This is used to submit URLs to be indexed. You can safely revoke it at any -->
<!--              time on the <NuxtLink class="underline"> -->
<!--              account page -->
<!--            </NuxtLink>. -->
<!--            </div> -->
<!--          </div> -->
<!--          <UButton external to="/h3/google-indexing" color="gray" icon="i-heroicons-lock-closed"> -->
<!--            Authorize Web Indexing API -->
<!--          </UButton> -->
<!--        </UCard> -->
<!--      </div> -->
</template>
