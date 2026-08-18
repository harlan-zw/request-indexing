import type { OAuthPoolToken } from './layers/core/app/types'
import process from 'node:process'
import { resolve } from 'path'
import { globbySync } from 'globby'
import { CLOUDFLARE_REQUIRED_SECRETS } from './shared/cloudflare'
import { runtimeOnlyRouteRules } from './shared/routes'
import { SENTRY_DSN } from './shared/sentry'

const tokens: Partial<OAuthPoolToken>[] = process.env.NUXT_OAUTH_POOL ? JSON.parse(process.env.NUXT_OAUTH_POOL) : []

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
  nuxtDx: {
    report: true,
  },

  nuxtSentry: {
    dsn: SENTRY_DSN,
    project: 'request-indexing',
  },

  modules: [
    '@harlan-zw/nuxt-domain-events',
    '@harlan-zw/nuxt-use-query',
    '@harlan-zw/nuxt-cloudflare',
    '@harlan-zw/nuxt-wide-events',
    '@harlan-zw/nuxt-dx',
    'nuxt-auth-utils',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@harlan-zw/comark-content',
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
    '@harlan-zw/nuxt-sentry',
  ],

  nuxtCloudflare: {
    kvCache: { binding: 'CACHE' },
    requiredSecrets: CLOUDFLARE_REQUIRED_SECRETS,
  },

  wideEvents: {
    service: 'request-indexing',
    request: true,
    fields: [],
    exclude: [
      '/__comark_content/**',
      '/_ipx/**',
      '/_nuxt/**',
      '/api/_nuxt_icon/**',
    ],
  },

  domainEvents: {
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

  linkChecker: {
    enabled: false,
    runOnBuild: false,
  },

  seo: {
    redirectToCanonicalSiteUrl: false,
  },

  // `@harlan-zw/nuxt-sentry` sets `sourcemap.client` when a Sentry auth token is
  // present, and deliberately leaves the server alone, where Nuxt defaults to true.
  // Without this the server bundle ships its own source maps.
  sourcemap: {
    server: false,
  },

  devtools: { enabled: true },

  skewProtection: {
    // `ws` rides Nitro's Durable Object websocket (cloudflare-durable preset +
    // nitro.experimental.websocket, both set below), so the server pushes its
    // deploy version and the client detects a stale build on reconnect.
    updateStrategy: 'ws',
    // `prompt` surfaces the update instead of reloading under the user, which
    // matters on a dashboard where a reload can interrupt work. Rendered by
    // `SkewNotification` in layers/core/app/app.vue; without that component this
    // strategy detects the stale build and then does nothing visible.
    reloadStrategy: 'prompt',
  },

  aiReady: {
    database: { type: 'd1', bindingName: 'DB' },
  },

  // `prerender: false` comes from `RUNTIME_ONLY_ROUTE_PREFIXES` so the same list
  // that keeps a route out of the prerender also keeps the site-wide OG image
  // off it. `ogImage.zeroRuntime` cannot render at runtime, so the two must
  // never disagree.
  routeRules: {
    ...runtimeOnlyRouteRules(),
    '/_alt/**': { robots: false, prerender: false },
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
      // Pins the worker to nodejs_compat v1. Nothing in the bundle needs v2's
      // fuller `node:stream` since the googleapis/jws chain was removed. To
      // move to v2, put `nodejs_compat_v2` in `wrangler.toml` instead; the
      // module resolves the flag pair Cloudflare accepts.
      nodeCompat: true,
      // Deploy values the authored `wrangler.toml` already carries are not
      // repeated here. @harlan-zw/nuxt-cloudflare reads that file and writes
      // them into the generated config, so a second copy only invites drift.
      wrangler: {
        logpush: true,
        triggers: {
          crons: ['0 0 * * *'], // Daily at midnight UTC
        },
        vars: {
          NUXT_PUBLIC_BASE_URL: 'https://requestindexing.com',
          // An OAuth client id is public (it ships in every authorize redirect),
          // so it is a default here rather than a build-time requirement. It
          // used to fall back to '', which meant any build run without the env
          // var silently deployed a Worker that could not start a Google
          // sign-in at all.
          NUXT_OAUTH_GOOGLE_CLIENT_ID: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID
            || '32479086022-b2upoo15sfpo0fpmgdgi95fh6oths219.apps.googleusercontent.com',
          // Kill switch for outbound user-facing sends (welcome email) and the
          // daily site-sync fan-out. Set to 'false' while migrating legacy data
          // so no user is emailed and no bulk sync is queued.
          NUXT_NOTIFICATIONS_ENABLED: process.env.NUXT_NOTIFICATIONS_ENABLED || 'false',
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
            { queue: 'ri-default', max_batch_size: 1, max_batch_timeout: 10, max_concurrency: 5, max_retries: 3, dead_letter_queue: 'ri-dlq' },
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
    // Gates every outbound user-facing send and the daily sync fan-out.
    // Override with NUXT_NOTIFICATIONS_ENABLED.
    notificationsEnabled: true,
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
    google: {
      adsClientId: '',
      adsClientSecret: '',
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
