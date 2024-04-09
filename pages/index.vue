<script lang="ts" setup>
const { loggedIn, user } = useUserSession()
</script>

<template>
  <div>
    <Gradient class="z-0" />
    <div class=" bg-gray-950 gradient top-slice">
      <div class="gradient-after" />
      <UContainer class="z-1 relative max-w-8xl xl:max-w-[1400px]" :ui="{ container: 'max-w-8xl xl:max-w-[1335px]!' }">
        <section class="py-5 sm:py-12 xl:py-20">
          <div class="xl:grid gap-8 xl:grid-cols-12 mx-auto w-full sm:px-6 lg:px-0 px-0">
            <div class="mx-auto max-w-[50rem] xl:col-span-7 xl:mr-10 xl:ml-0 mb-10 xl:mb-0 flex flex-col justify-center">
              <div class="">
                <div style="letter-spacing: -3px;" class="font-title font-bold leading-tight text-gray-900 dark:text-gray-100 text-center text-6xl lg:text-left mb-5">
                  <span>The <span class="underline">Open Source</span>                    <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" viewBox="0 0 24 24" class="text-yellow-500 inline"><path fill="currentColor" d="M10.917 6.575c-.155-.669-.287-1.235-.43-1.68l6.634 1.925c.044.013.158.063.315.476c.154.404.294.997.494 1.859l.12.516c.027.114.052.224.079.328l-6.012-1.666l-.304-.172c-.43-.245-.508-.302-.564-.38c-.062-.086-.099-.206-.22-.73zm3.425 3.412l5.008 1.387l.304.173c.706.403 1.183.676 1.493.924c.297.238.348.38.352.502c.005.127-.041.287-.327.573c-.294.295-.751.636-1.423 1.136l-.4.296c-.188.14-.359.266-.502.408l-6.805-1.974l.358-.266c.631-.469 1.15-.854 1.503-1.208c.367-.368.638-.783.618-1.316a1.376 1.376 0 0 0-.179-.635m-2.968 4.273l7.012 2.034c-.029.141-.052.293-.077.457l-.081.527c-.077.5-.191.947-.312 1.325c-.213.665-.268.758-.428.85c-.068.04-.133.056-.269.041c-.166-.018-.379-.078-.742-.184l-5.794-1.68c.07-.147.125-.304.171-.464c.145-.497.25-1.175.379-2.012l.075-.488c.027-.174.048-.305.066-.406" opacity=".5" /><path fill="currentColor" d="M7.406 6.073c.572-.639.964-1.074 1.28-1.338c.32-.266.425-.239.458-.23c.043.013.157.064.315.477c.154.404.293.997.494 1.858l.12.516c.093.403.17.738.364 1.008c.199.278.488.442.818.63l.064.035l.357.204c.707.403 1.183.676 1.493.924c.297.238.349.38.353.501c.005.128-.042.287-.327.574c-.294.295-.752.636-1.424 1.136l-.399.296c-.317.235-.584.433-.756.728c-.169.289-.22.627-.284 1.045l-.081.527c-.137.884-.232 1.496-.356 1.922c-.07.24-.137.373-.193.45c-.108-.04-.253-.1-.423-.181a6.454 6.454 0 0 1-1.517-1.022l-.312-.28l-.014-.013a7.193 7.193 0 0 0-.43-.37a1.437 1.437 0 0 0-.474-.25c-.324-.094-.659-.031-1.02.037l-.077.014l-.4.075c-.794.147-1.325.243-1.706.25c-.366.007-.443-.072-.484-.129c-.058-.08-.111-.236-.022-.674c.089-.436.289-1.017.58-1.857l.172-.497c.138-.4.25-.72.237-1.057c-.013-.34-.148-.646-.315-1.024l-.208-.47c-.35-.795-.591-1.343-.711-1.762c-.119-.415-.082-.583-.022-.685c.05-.085.139-.175.5-.22c.38-.047.915-.026 1.714.008l.404.017l.076.004c.367.016.703.03 1.015-.107c.303-.134.532-.39.795-.685l.055-.061z" /></svg>
                    <span class="whitespace-nowrap"> full stack SEO Tool</span> for developers.</span>
                </div>
              </div>
              <p class="text-gray-700 dark:text-gray-300 max-w-3xl text-center text-xl lg:text-left mb-5">
                Meet <strong>Request Indexing</strong>, the SEO tool for developers that cuts the complexity and cost of growing your organic traffic.
                Unlike Ahrefs, SEMRush and Moz, prices are kept low and transparent by relying on free <NuxtLink to="https://search.google.com/search-console/about" class="font-semibold hover:underline">
                  Google APIs
                </NuxtLink>.
              </p>
              <div class="mb-10 flex items-center justify-center gap-3 flex-row sm:gap-6 lg:justify-start">
                <UButton v-if="!loggedIn" icon="i-heroicons-arrow-long-right" to="/get-started" size="xl" external color="green">
                  <span>Get Started<span class="hidden sm:inline"> For Free</span></span>
                </UButton>
                <template v-else>
                  <UButton to="/dashboard" size="lg" color="gray">
                    <UAvatar :src="user.picture" size="xs" />
                    Dashboard
                  </UButton>
                </template>
                <UButton size="xl" variant="link" color="black" icon="i-simple-icons-github" target="_blank" to="https://github.com/harlan-zw/request-indexing">
                  View code
                </UButton>
              </div>

              <div class="space-y-7 mb-8 max-w-xl">
                <div class="text-gray-900 dark:text-gray-100 ">
                  <div class="flex items-start gap-4">
                    <div class="w-7 h-7 mt-1">
                      <UIcon name="i-heroicons-light-bulb-16-solid" class="w-7 h-7 flex-grow text-green-500/50" />
                    </div>
                    <div>
                      <div class="flex-shrink text-2xl mb-2 font-semibold font-title">
                        Keyword Insights & Research
                      </div>
                      <div class="text-gray-600">
                        Analyze your keywords with <span class="text-blue-500">content gap</span>, <span class="text-blue-500">top level</span>, <span class="text-blue-500">trending</span>, & 7 more. Use the dedicated keyword research tool to find new ways to rank.
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-gray-900 dark:text-gray-100 ">
                  <div class="flex items-start gap-4">
                    <div class="w-7 h-7 mt-1">
                      <UIcon name="i-heroicons-chart-bar-square-16-solid" class="w-7 h-7 flex-grow text-green-500/50" />
                    </div>
                    <div>
                      <div class="flex-shrink text-2xl mb-2 font-semibold font-title">
                        Google Search Console on god mode
                      </div>
                      <div class="text-gray-600">
                        Get new pages indexed within 48 hours, backup your data from being deleted. Advanced metrics for growth of pages and keywords.
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-gray-900 dark:text-gray-100">
                  <div class="flex items-start gap-4">
                    <div class="w-7 h-7 mt-1">
                      <UIcon name="i-heroicons-bolt-16-solid" class="w-7 h-7 flex-grow text-green-500/50" />
                    </div>
                    <div>
                      <div class="flex-shrink text-2xl font-semibold font-title">
                        Never Miss A Performance Regression
                      </div>
                      <div>Continuously monitor all of your sites with a CrUX and PageSpeed Insights dashboard.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="xl:col-span-5 relative max-w-full flex items-center justify-center">
              <UCard class="shadow-lg max-w-full">
                <template #header>
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center justify-between gap-7 w-full">
                      <div>
                        <div class="text-xl sm:text-3xl flex items-center gap-2 dark:text-gray-300 text-gray-900 ">
                          <img src="https://www.google.com/s2/favicons?domain=https://nuxtseo.com" alt="favicon" class="w-4 h-4 rounded-sm">
                          nuxtseo.com
                        </div>
                        <div>
                          <div class="opacity-60 text-sm sm:text-lg">
                            Domain Property
                          </div>
                        </div>
                      </div>
                      <div class="hidden sm:flex items-center text-right gap-3 text-gray-500 text-sm justify-end">
                        <span>% of your pages<br> indexed</span>
                        <MetricGuage :score="0.91">
                          <div class="text-xl">
                            91
                          </div>
                        </MetricGuage>
                      </div>
                    </div>
                  </div>
                </template>
              </UCard>
            </div>
          </div>
        </section>
      </UContainer>
    </div>
    <div class="dark:bg-gray-950">
      <UContainer class="z-1 relative">
        <ULandingSection
          id="dashboard"
          class="relative"
          align="left"
          title="Insights for all your sites in one dashboard"
          description="Google Search Console has no dashboard. Why is that? I'm not sure. It would be pretty useful, just check out these site cards."
          :features="[
            { name: 'All of your sites. One page.', description: 'See the search performance of all your sites in one a simple dashboard.', icon: 'i-heroicons-eye' },
            { name: 'Growth insights as clear as day.', description: 'See how your pages clicks and impressions are trending between periods, as well as your keywords.', icon: 'i-heroicons-chart-bar-square' },
            { name: 'See Percent Indexed', description: 'See the search performance of all your sites in one a simple dashboard.', icon: 'i-heroicons-arrow-path' },
          ]"
        >
          <div class="relative">
            <!--            <SiteCard -->
            <!--              v-for="(card, i) in SiteCards" :key="i" -->
            <!--              :site="{ siteUrl: card.siteUrl, permissionLevel: 'owner' }" -->
            <!--              :mock-data="card" -->
            <!--              :style="{ zIndex: 5 - i, translate: `${(i === 0 ? -1 : i) * 25}px ${i * 50}px` }" -->
            <!--              class="lg:absolute -bottom-20  right-0 w-full mx-auto max-w-[400px] bg-white shadow-xl" -->
            <!--              :class="i > 0 ? 'hidden lg:block' : ''" -->
            <!--            /> -->
          </div>
          <template #bottom>
            <div class="mt-12 max-w-3xl mx-auto">
              <UTabs
                class="" :items="[
                  // { label: 'Indexed Pages', count: SiteCards[0].period.length },
                  // { label: 'Keywords', count: SiteCards[0].keywords.length },
                ]"
              >
                <template #default="{ item, index, selected }">
                  <div class="flex items-center gap-2 relative truncate ">
                    <UBadge v-if="item.count" :color="selected ? 'green' : 'gray'">
                      {{ item.count }}
                    </UBadge>
                    <UIcon v-else-if="index === 0" name="i-heroicons-check-circle" class="w-5 h-5" :class="selected ? 'text-green-400' : 'text-gray-400'" />
                    <span class="truncate">{{ item.label }}</span>
                  </div>
                </template>
                <template #item="{ item }">
                  <div class="my-5 shadow-lg">
                    <UCard v-if="item.label === 'Indexed Pages'">
<!--                      <TableIndexedUrls :page-count="4" :value="SiteCards[0].period" site-url="nuxtseo.com" />-->
                    </UCard>
                    <UCard v-else>
<!--                      <TableKeywords :page-count="4" :value="SiteCards[0].keywords" />-->
                    </UCard>
                  </div>
                </template>
              </UTabs>
            </div>
          </template>
        </ULandingSection>

        <ULandingSection
          title="Google is deleting your valuable data"
          description="Your data is only stored for 16 months before its permanently deleted from Google Search Console. Without this data you won't be able to see larger trends on your sites."
          align="left"
          :features="[
            { name: 'Retain for as long as you want', description: 'You have your data retained for as long as you like, you will always have access to it and can export it.', icon: 'i-heroicons-circle-stack' },
            { name: 'Own your data', description: 'It\'s your data, do what you want with it. Export it, access it via an API or delete it.', icon: 'i-heroicons-eye-slash' },
          ]"
        >
          <ULandingTestimonial
            icon="i-simple-icons-google"
            quote="Search Console keeps data for the last 16 months. As a result, SEO reports in Analytics also include a maximum of 16 months of data."
            :author="{ name: 'Google Analytics', to: 'https://support.google.com/analytics/answer/1308621?hl=en#:~:text=Search%20Console%20keeps%20data%20for,is%20collected%20by%20Search%20Console.', target: '_blank' }"
            card
          />
        </ULandingSection>

        <ULandingSection title="You have questions">
          <ULandingFAQ
            :items="[
              {
                label: 'Does it actually work?',
                content: 'It does not guarantee to have all of your URLs indexed quicker, but it does, on average, speed up the process.',
              },
              {
                label: 'Will I be penalized for using this?',
                content: 'Nope! These are public APIs managed by Google. We just make it easier to use them.',
              }, {
                label: 'Can I see the code?',
                content: 'Sure! The entire project is open-source and available on GitHub under the MIT license. Build your own version if you like.',
              }]" multiple default-open class="max-w-3xl mx-auto"
          />
        </ULandingSection>

        <ULandingSection title="Built by developers, for developers" description="Request Indexing is a project build for everyone. It does not paywall you or expect you to know how to code.">
          <UPageGrid>
            <ULandingCard
              v-for="(item, index) in [
                { title: 'Open Source', description: 'Released under MIT license on GitHub. Built with Nuxt by a Nuxt core team as an idealized version of an open-source SaaS.', icon: 'i-heroicons-check-badge' },
                { title: 'Private', description: 'It\'s simple, we want as little of your data as possible to make a great tool. Delete your data at any time.', icon: 'i-heroicons-eye-slash' },
                { title: 'Secure', description: 'Encryption at rest and transit for sensitive data. Secure hashes to avoid leaking your Google sub, you name.', icon: 'i-heroicons-lock-closed' },
              ]" :key="index" v-bind="item"
            />
          </UPageGrid>
        </ULandingSection>

        <ULandingSection>
          <ULandingCTA title="Request Indexing on your pages today" description="Get started for free now and get your pages, find valuable insights through your GSC data and storing your GSC data older than 16 months." :links="[{ label: 'Get Started', to: '/get-started', size: 'xl' }]" class="bg-gray-100/50 dark:bg-gray-800/50">
            <template #description>
              <div class="text-lg max-w-xl mx-auto text-left space-y-5">
                <p>
                  ⚡ <a href="#" class="underline">Request indexing</a> on new sites and pages, have them appear on Google in 48 hours.
                </p>
                <p>
                  📊 <a href="#dashboard" class="underline">Dashboard</a> to see the search performance of all your Google Search Console sites.
                </p>
                <p>
                  🌲 <a href="#dashboard" class="underline">Keep your site data</a>. Google Search Console data deletes site data longer than 16 months, start keeping it.
                </p>
              </div>
            </template>
          </ULandingCTA>
        </ULandingSection>
      </UContainer>
    </div>
  </div>
</template>

<style>
@keyframes moveBackground {
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
.gradient {
  position: relative;
  background-size: 400% 400%;
  animation: moveBackground 30s ease infinite;
  background-image: linear-gradient(47deg,
  rgb(var(--color-primary-50)) 0%,
  #fae8ff 15%,
  rgb(var(--color-primary-50)) 30%,
  #e0e7ff 45%,
  rgb(var(--color-primary-50)) 60%,
  #ccfbf1 75%,
  rgb(var(--color-primary-50)) 90%,
  #fae8ff 100%
  ) !important;
}

.gradient-after {
  width: 100%;
  height: 100%;
    position: absolute;
    background-size: 300% 300%;
    animation: moveBackground 10s ease infinite;
  background-image: linear-gradient(0deg,
  rgb(var(--color-primary-50)) 0%,
  #fae8ff 15%,
  rgb(var(--color-primary-50)) 30%,
  #e0e7ff 45%,
  rgb(var(--color-primary-50)) 60%,
  #ccfbf1 75%,
  rgb(var(--color-primary-50)) 90%,
  #fae8ff 100%
  ) !important;
  opacity: 0.5;
}

.top-slice {
  position: relative;
  &:after {
    content: "";
    position: absolute;
    bottom: -70px;
    background-color: white;
    height: 140px;
    width: 120vw;
    left: -10px;
    transform: rotate(-2deg);
  }
}
</style>
