import type { OAuthPoolToken } from './app/types'
import { resolve } from 'path'
import { globbySync } from 'globby'
import { env } from 'std-env'

const tokens: Partial<OAuthPoolToken>[] = env.NUXT_OAUTH_POOL ? JSON.parse(env.NUXT_OAUTH_POOL) : false

// read all the folders at the server/app path
const recursiveServerAppFolders = globbySync('**/*', {
  cwd: resolve('./server/app'),
  onlyDirectories: true,
  deep: 4,
  absolute: true,
})

export default defineNuxtConfig({
  modules: [
    'nuxt-auth-utils',
    'dayjs-nuxt',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/scripts',
    'nitro-cloudflare-dev',
    (_, nuxt) => {
      nuxt.options.nitro!.virtual = nuxt.options.nitro!.virtual || {}
      nuxt.options.nitro.virtual['#app/token-pool.mjs'] = `export const tokens = ${JSON.stringify(tokens)}`
    },
    '@nuxt/fonts',
  ],

  compatibilityDate: '2026-03-03',

  css: ['~/assets/css/main.css'],

  hooks: {
    'nitro:config': function (config) {
      config.typescript = config.typescript || {}
      config.typescript.tsConfig = config.typescript.tsConfig || {}
      config.typescript.tsConfig.include = config.typescript.tsConfig.include || []
      config.typescript.tsConfig.include.push(resolve('./server/hooks.d.ts'))
    },
  },

  site: {
    url: 'https://requestindexing.com',
    name: 'Request Indexing',
    description: 'Monitor and request Google indexing for your pages',
    defaultLocale: 'en',
    indexable: true,
  },

  sitemap: {
    exclude: [
      '/dashboard/**',
      '/api/**',
      '/auth/**',
    ],
  },

  robots: {
    disallow: [
      '/dashboard/**',
      '/api/**',
      '/auth/**',
    ],
  },

  schemaOrg: {
    identity: {
      type: 'Organization',
      name: 'Request Indexing',
      logo: '/favicon.svg',
    },
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light', dark: 'github-dark' },
          langs: ['typescript', 'javascript', 'python', 'bash', 'json', 'yaml'],
        },
      },
    },
  },

  linkChecker: {
    enabled: false,
    runOnBuild: false,
  },

  seo: {
    redirectToCanonicalSiteUrl: false,
  },

  devtools: { enabled: true },

  routeRules: {
    '/dashboard/**': { prerender: false },
    '/account/**': { prerender: false },
    '/auth/**': { prerender: false },
    '/api/**': { prerender: false },
    '/ws/**': { prerender: false },
  },

  nitro: {
    alias: {
      '~/server': resolve('./server'),
    },
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: false,
    },
    preset: 'cloudflare-durable',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: 'request-indexing',
        compatibility_date: '2025-01-15',
        observability: {
          enabled: true,
          head_sampling_rate: 1,
        },
        logpush: true,
        triggers: {
          crons: ['0 0 * * *'], // Daily at midnight UTC
        },
        vars: {
          NUXT_PUBLIC_BASE_URL: 'https://requestindexing.com',
          NUXT_KEY: process.env.NUXT_KEY || '',
          NUXT_SESSION_PASSWORD: process.env.NUXT_SESSION_PASSWORD || '',
          NUXT_OAUTH_POOL: process.env.NUXT_OAUTH_POOL || '',
          NUXT_OAUTH_PRIVATE_POOL: process.env.NUXT_OAUTH_PRIVATE_POOL || '',
          NUXT_OAUTH_GOOGLE_CLIENT_ID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || '',
          NUXT_OAUTH_GOOGLE_CLIENT_SECRET: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET || '',
          NUXT_POSTMARK_API_KEY: process.env.NUXT_POSTMARK_API_KEY || '',
          NUXT_GOOGLE_ADS_CUSTOMER_ID: process.env.NUXT_GOOGLE_ADS_CUSTOMER_ID || '',
          NUXT_GOOGLE_ADS_API_TOKEN: process.env.NUXT_GOOGLE_ADS_API_TOKEN || '',
          NUXT_GOOGLE_ADS_CLIENT_ID: process.env.NUXT_GOOGLE_ADS_CLIENT_ID || '',
          NUXT_GOOGLE_ADS_CLIENT_SECRET: process.env.NUXT_GOOGLE_ADS_CLIENT_SECRET || '',
          NUXT_GOOGLE_ADS_REFRESH_TOKEN: process.env.NUXT_GOOGLE_ADS_REFRESH_TOKEN || '',
          NUXT_GOOGLE_CRUX_API_TOKEN: process.env.NUXT_GOOGLE_CRUX_API_TOKEN || '',
          NUXT_GSCDUMP_API_KEY: process.env.NUXT_GSCDUMP_API_KEY || '',
          NUXT_GSCDUMP_WEBHOOK_SECRET: process.env.NUXT_GSCDUMP_WEBHOOK_SECRET || '',
          NUXT_DATAFORSEO_LOGIN: process.env.NUXT_DATAFORSEO_LOGIN || '',
          NUXT_DATAFORSEO_PASSWORD: process.env.NUXT_DATAFORSEO_PASSWORD || '',
        },
        durable_objects: {
          bindings: [
            { name: '$DurableObject', class_name: '$DurableObject' },
          ],
        },
        migrations: [
          { tag: 'v1', new_classes: ['$DurableObject'] },
        ],
        queues: {
          producers: [
            { queue: 'ri-default', binding: 'QUEUE_DEFAULT' },
            { queue: 'ri-psi', binding: 'QUEUE_PSI' },
            { queue: 'ri-dlq', binding: 'QUEUE_DLQ' },
          ],
          consumers: [
            { queue: 'ri-default', max_batch_size: 1, max_batch_timeout: 10, max_concurrency: 5, max_retries: 5, dead_letter_queue: 'ri-dlq' },
            { queue: 'ri-psi', max_batch_size: 1, max_batch_timeout: 30, max_concurrency: 3, max_retries: 3, dead_letter_queue: 'ri-dlq' },
            { queue: 'ri-dlq', max_batch_size: 1, max_batch_timeout: 60, max_concurrency: 1, max_retries: 3 },
          ],
        },
      },
    },
    storage: {
      cache: { driver: 'cloudflare-kv-binding', binding: 'CACHE' },
    },
    devStorage: {
      cache: { driver: 'memory' },
    },
    sourceMap: false,
    experimental: {
      asyncContext: true,
      websocket: true,
      tasks: true,
    },
    scheduledTasks: {
      '0 0 * * *': ['sync.daily'],
    },
    imports: {
      dirs: recursiveServerAppFolders,
    },
    externals: {
      inline: ['drizzle-orm'],
    },
  },

  icon: {
    serverBundle: 'remote',
    clientBundle: {
      scan: true,
    },
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

  dayjs: {
    locales: ['en'],
    plugins: ['relativeTime', 'utc', 'isSameOrBefore', 'advancedFormat'],
    defaultLocale: 'en',
  },

  fonts: {
    families: [
      { name: 'DM Sans', weights: [400, 500, 600, 700], global: true },
      { name: 'Poppins', weights: [600, 700], global: true },
    ],
  },

  runtimeConfig: {
    key: '', // .env NUXT_KEY
    session: {
      cookie: {
        maxAge: 60 * 60 * 24 * 90, // 3mo
      },
    },
    google: {
      adsCustomerId: '',
      adsApiToken: '',
      cruxApiToken: '',
      adsClientId: '',
      adsClientSecret: '',
      adsRefreshToken: '',
    },
    postmark: {
      apiKey: '',
    },
    gscdump: {
      apiKey: '',
      webhookSecret: '',
    },
    dataforseo: {
      login: '',
      password: '',
    },
    public: {
      baseUrl: 'https://requestindexing.com',
      indexing: {
        usageLimitPerUser: 15,
      },
    },
    indexing: {
      maxUsersPerOAuth: 100,
    },
  },
})
