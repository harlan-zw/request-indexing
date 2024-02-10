import { env } from 'std-env'

const seed: OAuthToken[] = env.NUXT_APP_INDEXING_SEED ? JSON.parse(env.NUXT_APP_INDEXING_SEED) : false

export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: [
    'nuxt-auth-utils',
    'dayjs-nuxt',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/fontaine',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
  ],
  runtimeConfig: {
    session: {
      cookie: {
        maxAge: 60 * 60 * 24 * 90, // 3mo
      },
    },
    public: {
      features: {
        keyLogin: false,
        crawler: false,
      },
      indexing: {
        usageLimitPerUser: 15,
      },
    },
    indexing: {
      maxUsersPerOAuth: 15, // we over provision slightly (25 over),
      seed, // runtime seeding :)
    },
  },
  ui: {
    icons: ['heroicons', 'simple-icons', 'ph'],
  },
  site: {
    url: 'requestindexing.com',
  },
  // Fonts
  fontMetrics: {
    fonts: ['DM Sans'],
  },
  googleFonts: {
    display: 'swap',
    download: true,
    families: {
      'DM+Sans': [300, 400, 500, 600, 700],
    },
  },
  dayjs: {
    locales: ['en'],
    plugins: ['relativeTime', 'utc'],
    defaultLocale: 'en',
  },
  devtools: { enabled: true },
})
