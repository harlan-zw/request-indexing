import { env } from 'std-env'
import { hash } from 'ohash'
import type { OAuthPoolToken } from '~/types'

let tokens: Partial<OAuthPoolToken>[] = env.NUXT_OAUTH_POOL ? JSON.parse(env.NUXT_OAUTH_POOL) : []
const privateTokens: Partial<OAuthPoolToken>[] = env.NUXT_OAUTH_PRIVATE_POOL ? JSON.parse(env.NUXT_OAUTH_PRIVATE_POOL) : []

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
    (_, nuxt) => {
      // seed the main tokens if there isn't a pool available
      if (tokens.length === 0) {
        tokens = [{
          label: 'primary',
          client_id: env.NUXT_OAUTH_GOOGLE_CLIENT_ID!,
          client_secret: env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET!,
        }]
      }
      nuxt.options.nitro!.virtual = nuxt.options.nitro!.virtual || {}
      nuxt.options.nitro.virtual['#app/token-pool.mjs']
        = [
          `export const tokens = ${JSON.stringify(tokens.map((t) => {
            t.id = t.id || hash(t)
            return t
          }))}`,
          `export const privateTokens = ${JSON.stringify(privateTokens.map((t) => {
            t.id = t.id || hash(t)
            return t
          }))}`,
        ].join('\n')
    },
  ],
  runtimeConfig: {
    key: '', // .env NUXT_KEY
    session: {
      cookie: {
        maxAge: 60 * 60 * 24 * 90, // 3mo
      },
    },
    postmark: {
      apiKey: '', // .env NUXT_POSTMARK_API_KEY
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
    },
  },
  nitro: {
    vercel: {
      functions: {
        maxDuration: 90, // second timeout for API calls
      },
    },
    devStorage: {
      app: {
        base: '.db',
        driver: 'fs',
      },
    },
    storage: {
      app: {
        driver: 'vercelKV',
      },
    },
  },
  ui: {
    icons: ['heroicons', 'simple-icons', 'ph'],
  },
  app: {
    pageTransition: {
      name: 'page',
      mode: 'out-in',
    },
    seoMeta: {
      themeColor: [
        { content: '#18181b', media: '(prefers-color-scheme: dark)' },
        { content: 'white', media: '(prefers-color-scheme: light)' },
      ],
    },
    head: {
      templateParams: {
        separator: '·',
      },
      script: [
        {
          'src': 'https://cdn.usefathom.com/script.js',
          'data-spa': 'auto',
          'data-site': 'UHBNWPCP',
          'defer': true,
        },
      ],
    },
  },
  site: {
    name: 'Request Indexing',
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
