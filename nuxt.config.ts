import { resolve } from 'path'
import { env } from 'std-env'
import { hash } from 'ohash'
import { globbySync } from 'globby'
import NuxtMessageQueue from './lib/nuxt-ttyl/module'
import type { OAuthPoolToken } from '~/types'

let tokens: Partial<OAuthPoolToken>[] = env.NUXT_OAUTH_POOL ? JSON.parse(env.NUXT_OAUTH_POOL) : false

// read all the folders at the server/app path
const recursiveServerAppFolders = globbySync('**/*', {
  cwd: resolve('./server/app'),
  onlyDirectories: true,
  deep: 4,
  absolute: true,
})

export default defineNuxtConfig({
  extends: ['@nuxt/ui-pro'],
  modules: [
    'nuxt-auth-utils',
    'dayjs-nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    NuxtMessageQueue,
    (_, nuxt) => {
      // seed the main tokens if there isn't a pool available
      if (!tokens) {
        tokens = [{
          label: 'primary',
          client_id: env.NUXT_OAUTH_GOOGLE_CLIENT_ID!,
          client_secret: env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET!,
        }]
      }
      nuxt.options.nitro!.virtual = nuxt.options.nitro!.virtual || {}
      nuxt.options.nitro.virtual['#app/token-pool.mjs'] = `export const tokens = ${JSON.stringify(tokens.map((t) => {
        t.id = t.id || hash(t)
        return t
      }))}`
    },
  ],
  messageQueue: {
    devMessageQueue: {
      driver: 'unstorage',
      storage: {
        base: '.db/queue',
        driver: 'fs',
      },
    },
  },
  runtimeConfig: {
    key: '', // .env NUXT_KEY
    session: {
      cookie: {
        maxAge: 60 * 60 * 24 * 90, // 3mo
      },
    },
    google: {
      adsCustomerId: '', // .env NUXT_GOOGLE_ADS_CUSTOMER_ID
      adsApiToken: '', // .env NUXT_GOOGLE_ADS_API_TOKEN
      cruxApiToken: '', // .env NUXT_GOOGLE_CRUX_API_TOKEN
    },
    postmark: {
      apiKey: '', // .env NUXT_POSTMARK_API_KEY
    },
    public: {
      indexing: {
        usageLimitPerUser: 15,
      },
    },
    indexing: {
      maxUsersPerOAuth: 15, // we over provision slightly (25 over),
    },
  },
  nitro: {
    imports: {
      dirs: recursiveServerAppFolders,
    },
    devStorage: {
      app: {
        base: '.db',
        driver: 'fs',
      },
      // pageAnalytics: {
      //   base: '.db/pageAnalytics',
      //   driver: 'fs',
      // },
    },
    storage: {
      // upstash redis
      app: {
        driver: 'vercelKV',
        url: 'https://us1-big-honeybee-39192.upstash.io',
        token: 'AZkYASQgYzM1NTg2Y2QtMTAwZS00Mjk3LTllZWItMTJhNjZhZjFmMmE2NGMzYWMzYTM5ODgwNDJhMmEyZjM4YTFjNzZiMWJhMWM=',
      },
      // pageAnalytics: {
      //   driver: 'http',
      //   base: 'https://endless-maggot-11706-us1-rest-kafka.upstash.io/produce/page_analytics/MESSAGE',
      //   headers: {
      //     Authorization: `Basic ${process.env.KAFKA_REST_API_KEY}`,
      //   },
      // },
    },
  },
  ui: {
    icons: ['heroicons', 'carbon', 'simple-icons', 'ph', 'circle-flags'],
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
  dayjs: {
    locales: ['en'],
    plugins: ['relativeTime', 'utc', 'isSameOrBefore', 'advancedFormat'],
    defaultLocale: 'en',
  },
  devtools: { enabled: true },
})
