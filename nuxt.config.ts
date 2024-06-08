import { resolve } from 'path'
import { env } from 'std-env'
import { globbySync } from 'globby'
import NuxtMessageQueue from './lib/nuxt-ttyl/module'
import type { OAuthPoolToken } from '~/types'

const tokens: Partial<OAuthPoolToken>[] = env.NUXT_OAUTH_POOL ? JSON.parse(env.NUXT_OAUTH_POOL) : false

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
    '@nuxthub/core',
    'nuxt-auth-utils',
    'dayjs-nuxt',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxtjs/seo',
    NuxtMessageQueue,
    (_, nuxt) => {
      nuxt.options.nitro!.virtual = nuxt.options.nitro!.virtual || {}
      nuxt.options.nitro.virtual['#app/token-pool.mjs'] = `export const tokens = ${JSON.stringify(tokens)}`
    },
  ],
  ogImage: {
    enabled: false,
  },
  hooks: {
    'nitro:config': function (config) {
      config.typescript = config.typescript || {}
      config.typescript.tsConfig = config.typescript.tsConfig || {}
      config.typescript.tsConfig.include = config.typescript.tsConfig.include || []
      config.typescript.tsConfig.include.push(resolve('./server/hooks.d.ts'))
    },
  },
  messageQueue: {
    devMessageQueue: {
      // driver: 'cloudflare',
      // queue: 'google-search-console',
      // binding: 'QUEUE_GOOGLE_SEARCH_CONSOLE',
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
      adsClientId: '', // NUXT_GOOGLE_ADS_CLIENT_ID,
      adsClientSecret: '', // NUXT_GOOGLE_ADS_CLIENT_SECRET
      adsRefreshToken: '', // NUXT_GOOGLE_ADS_REFRESH_TOKEN
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
    preset: 'cloudflare-pages',
    experimental: {
      websocket: true,
      tasks: true,
    },
    scheduledTasks: {
      // Run `cms:update` task every minute
      '0 0 * * *': ['sync.daily'],
    },
    imports: {
      dirs: recursiveServerAppFolders,
    },
    devStorage: {
      app: {
        base: '.db',
        driver: 'fs',
      },
    },
  },
  ui: {
    icons: ['heroicons', 'logos', 'carbon', 'simple-icons', 'ph', 'circle-flags'],
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
  // $development: {
  //   hub: {
  //     remote: 'preview',
  //   },
  // },
  hub: {
    database: true,
    kv: true,
    blob: true,
    cache: true,
    remote: false,
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
