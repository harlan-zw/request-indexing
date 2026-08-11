import type { OAuthPoolToken } from './layers/core/app/types'
import { existsSync } from 'node:fs'
import process from 'node:process'
import { resolve } from 'path'
import { globbySync } from 'globby'
import { withoutRollupPlugin } from './scripts/rollup-plugins'
import { CLOUDFLARE_REQUIRED_SECRETS } from './shared/cloudflare'
import { SENTRY_DSN } from './shared/sentry'

const tokens: Partial<OAuthPoolToken>[] = process.env.NUXT_OAUTH_POOL ? JSON.parse(process.env.NUXT_OAUTH_POOL) : []
const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN)
  || existsSync('.env.sentry-build-plugin')
const sentryRelease = process.env.SENTRY_RELEASE || process.env.GITHUB_SHA || undefined

// read all the folders at the server/app path
const recursiveServerAppFolders = globbySync('**/*', {
  cwd: resolve('./layers/core/server/app'),
  onlyDirectories: true,
  deep: 4,
  absolute: true,
})

export default defineNuxtConfig({
  alias: {
    h3: resolve('./node_modules/h3/dist/index.mjs'),
  },
  extends: [
    './apps/marketing',
    './apps/app',
    './apps/admin',
    './apps/brand-kit',
    './layers/design-system',
    './layers/pro-shell',
    './layers/pro-saas-auth',
    './layers/pro-saas',
    './layers/pro-gsc',
    './layers/pro-indexing',
    './layers/core',
  ],
  modules: [
    '@harlan-zw/nuxt-domain-events',
    '@harlan-zw/nuxt-use-query',
    '@harlan-zw/nuxt-cloudflare',
    '@harlan-zw/nuxt-dx',
    'nuxt-auth-utils',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/content',
    '@nuxtjs/seo',
    'nuxt-ai-ready',
    'nuxt-skew-protection',
    '@nuxt/scripts',
    'nitro-cloudflare-dev',
    (_, nuxt) => {
      nuxt.options.nitro!.virtual = nuxt.options.nitro!.virtual || {}
      nuxt.options.nitro.virtual['#app/token-pool.mjs'] = `export const tokens = ${JSON.stringify(tokens)}`
    },
    '@nuxt/fonts',
    '@sentry/nuxt/module',
    (_, nuxt) => {
      nuxt.hook('vite:extendConfig', (config, { isServer }) => {
        if (isServer && Array.isArray(config.plugins)) {
          const plugins = withoutRollupPlugin(config.plugins, 'sentry-vite-plugin')
          config.plugins.splice(0, config.plugins.length, ...plugins)
        }
      })
      nuxt.hook('nitro:config', (config) => {
        const plugins = config.rollupConfig?.plugins
        if (Array.isArray(plugins)) {
          config.rollupConfig!.plugins = withoutRollupPlugin(plugins, 'sentry-rollup-plugin')
        }
      })
    },
  ],

  nuxtCloudflare: {
    kvCache: { binding: 'CACHE' },
    requiredSecrets: CLOUDFLARE_REQUIRED_SECRETS,
  },

  domainEvents: {
    queues: [],
    observer: 'layers/pro-saas/server/utils/domain-event-observer.ts',
    allowEmptyEvents: [
      'pro:gsc:webhook',
      'pro:integration:linked',
      'pro:user:deleted',
    ],
  },

  compatibilityDate: '2026-08-11',

  css: ['~~/layers/design-system/assets/css/main.css'],

  hooks: {
    'nitro:config': function (config) {
      config.typescript = config.typescript || {}
      config.typescript.tsConfig = config.typescript.tsConfig || {}
      config.typescript.tsConfig.include = config.typescript.tsConfig.include || []
      config.typescript.tsConfig.include.push(resolve('./layers/core/server/hooks.d.ts'))
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
    zeroRuntime: true,
    exclude: [
      '/__nuxt_content/**',
      '/_alt/**',
      '/dashboard/**',
      '/pro/**',
      '/api/**',
      '/auth/**',
      '/kit/**',
    ],
  },

  ogImage: {
    zeroRuntime: true,
  },

  robots: {
    disallow: [
      '/_alt/**',
      '/dashboard/**',
      '/pro/**',
      '/api/**',
      '/auth/**',
      '/kit/**',
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

  skewProtection: {
    updateStrategy: 'ws',
    reloadStrategy: 'idle',
  },

  aiReady: {
    database: { type: 'd1', bindingName: 'DB' },
  },

  routeRules: {
    '/_alt/**': { robots: false, prerender: false },
    '/dashboard/**': { prerender: false },
    '/pro/**': { prerender: false },
    '/account/**': { prerender: false },
    '/auth/**': { prerender: false },
    '/api/**': { prerender: false },
    '/ws/**': { prerender: false },
  },

  nitro: {
    alias: {
      'h3': resolve('./node_modules/h3/dist/index.mjs'),
      '~/server': resolve('./layers/core/server'),
      // `#schema` aggregates pro-saas's typed drizzle surface. Activated once
      // the layer is added to `extends` (plug phase). Until then, no consumer
      // resolves the alias because the layer is not in the build graph.
      '#schema': resolve('./layers/pro-saas/server/database/_surface.ts'),
    },
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: true,
    },
    preset: 'cloudflare-durable',
    cloudflare: {
      deployConfig: true,
      // `nodeCompat: true` is Nitro's legacy unenv shim, which emits
      // `no_nodejs_compat_v2` and pins the worker to nodejs_compat v1. Under v1
      // `node:stream` has no `Stream` export, so `jws` (pulled in eagerly by
      // google-auth-library) calls `util.inherits(DataStream, undefined)` at
      // module scope and the worker fails Cloudflare's startup validation with
      // error 10021. Our compatibility_date is well past v2's 2024-09-23
      // cutoff, so use the runtime's own Node implementation instead.
      nodeCompat: false,
      wrangler: {
        name: 'request-indexing',
        compatibility_date: '2026-08-11',
        compatibility_flags: ['nodejs_compat'],
        workers_dev: false,
        preview_urls: false,
        cache: { enabled: true, cross_version_cache: false },
        placement: { mode: 'smart' },
        version_metadata: { binding: 'CF_VERSION_METADATA' },
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
          NUXT_OAUTH_GOOGLE_CLIENT_ID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID || '',
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
            { queue: 'ri-dlq', binding: 'QUEUE_DLQ' },
          ],
          consumers: [
            { queue: 'ri-default', max_batch_size: 1, max_batch_timeout: 10, max_concurrency: 5, max_retries: 5, dead_letter_queue: 'ri-dlq' },
            { queue: 'ri-dlq', max_batch_size: 1, max_batch_timeout: 60, max_concurrency: 1, max_retries: 3 },
          ],
        },
      },
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
      meta: [
        { name: 'theme-color', content: '#18181b', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: 'white', media: '(prefers-color-scheme: light)' },
      ],
    },
  },

  vite: {
    optimizeDeps: {
      include: [
        '@gscdump/sdk',
        '@gscdump/sdk/v1',
        'motion-v',
        'reka-ui',
      ],
    },
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
      password: '',
      maxAge: 60 * 60 * 24 * 90, // 3mo
    },
    postmark: {
      apiKey: '',
    },
    gscdump: {
      apiUrl: 'https://gscdump.com/api',
      apiKey: '',
      webhookSecret: '',
      // Where gscdump delivers webhooks for sites we register. Override via
      // NUXT_GSCDUMP_WEBHOOK_URL in dev/preview (e.g. a tunnel); the default
      // silently points non-prod registrations at prod otherwise.
      webhookUrl: 'https://requestindexing.com/api/webhooks/gscdump',
    },
    dataforseo: {
      login: '',
      password: '',
    },
    sentry: {
      dsn: SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      environment: 'production',
      release: sentryRelease ?? '',
      tracesSampleRate: 0.05,
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

  sentry: {
    enabled: process.env.NODE_ENV === 'production',
    org: 'harlan-zw',
    project: 'request-indexing',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    release: { name: sentryRelease },
    sourcemaps: {
      disable: !hasSentryAuthToken,
      filesToDeleteAfterUpload: ['**/*.map'],
    },
    bundleSizeOptimizations: {
      excludeReplayShadowDom: true,
      excludeReplayIframe: true,
      excludeReplayWorker: true,
    },
    telemetry: false,
  },

  sourcemap: {
    client: hasSentryAuthToken ? 'hidden' : false,
    server: false,
  },
})
