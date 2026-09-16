<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'

// Ported from nuxtseo.com's `developers.vue` + `developers/index.vue`. This app
// has no API of its own: its data plane is gscdump (VISION.md), so every setup
// method points at gscdump. gscdump keys its accounts by Google account, so the
// same Google sign-in reaches the Sites this account syncs. nuxtseo.com's
// token list, MCP connection list and request logs have no equivalent here.
definePageMeta({
  layout: 'pro-dashboard',
  title: 'Developers',
  icon: 'i-heroicons-command-line',
})

type SetupMethod = 'cli' | 'mcp' | 'api'

interface ClientIcon { label: string, icon: string }
interface SetupMethodOption {
  id: SetupMethod
  label: string
  hint: string
  description: string
  clients: ClientIcon[]
}

const setupMethods: SetupMethodOption[] = [
  {
    id: 'cli',
    label: 'CLI',
    hint: 'Recommended',
    description: 'Use it in a terminal or from a coding agent.',
    clients: [
      { label: 'Claude Code', icon: 'i-simple-icons-anthropic' },
      { label: 'Cursor', icon: 'i-simple-icons-cursor' },
      { label: 'Codex CLI', icon: 'i-simple-icons-openai' },
    ],
  },
  {
    id: 'mcp',
    label: 'MCP',
    hint: 'No terminal',
    description: 'Connect a hosted AI client.',
    clients: [
      { label: 'Claude', icon: 'i-simple-icons-anthropic' },
      { label: 'ChatGPT', icon: 'i-simple-icons-openai' },
      { label: 'Cursor', icon: 'i-simple-icons-cursor' },
    ],
  },
  {
    id: 'api',
    label: 'API',
    hint: 'Scripts',
    description: 'Call the HTTP API directly.',
    clients: [
      { label: 'cURL', icon: 'i-simple-icons-curl' },
    ],
  },
]

const route = useRoute()

function parseSetupMethod(value: unknown): SetupMethod {
  return value === 'mcp' || value === 'api' ? value : 'cli'
}

const setupMethod = computed(() => parseSetupMethod(route.query.setup))

function selectSetupMethod(method: SetupMethod) {
  void navigateTo({ query: { ...route.query, setup: method === 'cli' ? undefined : method } }, { replace: true })
}

const GSCDUMP_API_KEY_URL = 'https://gscdump.com/app/developers?setup=api'

type Step
  = | { _tag: 'command', title: string, body: string, value: string }
    | { _tag: 'link', title: string, body: string, to: string, label: string }

const quickStartDescription = computed(() => {
  if (setupMethod.value === 'mcp')
    return 'Add the server once. Then ask your client about your Search Console data.'
  if (setupMethod.value === 'api')
    return 'Send your gscdump API key as a bearer token.'
  return 'Sign in once on each machine. Then run queries from the terminal or an agent.'
})

const steps = computed<Step[]>(() => {
  if (setupMethod.value === 'mcp') {
    return [
      {
        _tag: 'command',
        title: 'Add the MCP server',
        body: 'Enter this URL in Claude, ChatGPT, or another MCP client that supports OAuth.',
        value: 'https://gscdump.com/mcp',
      },
      {
        _tag: 'link',
        title: 'Approve access',
        body: 'Sign in to gscdump with the Google account you use here. Then approve the connection.',
        to: 'https://gscdump.com/learn-google-search-console/ai-agents/mcp-server',
        label: 'Read the MCP setup guide',
      },
    ]
  }
  if (setupMethod.value === 'api') {
    return [
      {
        _tag: 'link',
        title: 'Create an API key',
        body: 'Sign in to gscdump with the Google account you use here. One key authenticates the CLI, MCP clients, and the API.',
        to: GSCDUMP_API_KEY_URL,
        label: 'Create a key on gscdump',
      },
      {
        _tag: 'command',
        title: 'Call the API',
        body: 'Send the key as a bearer token.',
        value: 'curl -H "Authorization: Bearer $GSCDUMP_API_KEY" \\\n  https://gscdump.com/api/partner/v1/sites',
      },
    ]
  }
  return [
    {
      _tag: 'command',
      title: 'Install the CLI',
      body: 'Use Node.js 22.13 or later.',
      value: 'npm install -g @gscdump/cli',
    },
    {
      _tag: 'link',
      title: 'Create an API key',
      body: 'Sign in to gscdump with the Google account you use here.',
      to: GSCDUMP_API_KEY_URL,
      label: 'Create a key on gscdump',
    },
    {
      _tag: 'command',
      title: 'Sign in',
      body: 'Paste the key when the CLI asks for it.',
      value: 'gscdump auth login --mode cloud',
    },
    {
      _tag: 'command',
      title: 'List your Sites',
      body: 'Every command has --help.',
      value: 'gscdump sites',
    },
  ]
})

const { copy, copied } = useClipboard({ legacy: true })
const copiedValue = ref<string | null>(null)
function copyValue(value: string) {
  copiedValue.value = value
  void copy(value)
}
</script>

<template>
  <div class="max-w-3xl space-y-8">
    <p class="text-sm text-muted">
      Request Indexing runs on <a href="https://gscdump.com" target="_blank" rel="noopener" class="text-primary hover:underline">gscdump</a>.
      The gscdump CLI, MCP server, and API read the same Search Console data this account syncs.
    </p>

    <section aria-labelledby="setup-method-heading">
      <h2 id="setup-method-heading" class="text-base font-semibold text-highlighted">
        Choose how to connect
      </h2>
      <p class="mt-1 text-sm text-muted">
        Every option reads the same data.
      </p>

      <div class="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Setup method">
        <button
          v-for="method in setupMethods"
          :id="`setup-${method.id}`"
          :key="method.id"
          type="button"
          role="tab"
          :aria-selected="setupMethod === method.id"
          aria-controls="setup-quick-start"
          class="min-h-24 min-w-44 flex-1 cursor-pointer rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary"
          :class="setupMethod === method.id ? 'border-accented bg-elevated text-highlighted' : 'border-default bg-default text-muted hover:border-accented hover:text-default'"
          @click="selectSetupMethod(method.id)"
        >
          <span class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold">{{ method.label }}</span>
            <span class="text-xs" :class="setupMethod === method.id ? 'text-primary' : 'text-dimmed'">{{ method.hint }}</span>
          </span>
          <span class="mt-1 block text-xs text-muted">{{ method.description }}</span>
          <span class="mt-3 flex items-center gap-2 text-dimmed" aria-hidden="true">
            <UIcon
              v-for="client in method.clients"
              :key="client.label"
              :name="client.icon"
              class="size-4 shrink-0"
            />
          </span>
          <span class="sr-only">{{ method.clients.map(client => client.label).join(', ') }}</span>
        </button>
      </div>
    </section>

    <section
      id="setup-quick-start"
      role="tabpanel"
      :aria-labelledby="`setup-${setupMethod}`"
    >
      <h2 class="text-base font-semibold text-highlighted">
        Quick start
      </h2>
      <p class="mt-1 text-sm text-muted">
        {{ quickStartDescription }}
      </p>

      <ol class="mt-5 flex flex-col gap-6">
        <li v-for="(step, i) in steps" :key="step.title" class="flex gap-3">
          <span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-default bg-elevated font-mono text-xs text-muted">
            {{ i + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-highlighted">
              {{ step.title }}
            </p>
            <p class="mt-0.5 text-sm text-muted">
              {{ step.body }}
            </p>

            <div
              v-if="step._tag === 'command'"
              class="mt-2.5 flex min-h-11 items-center gap-2 rounded-lg border border-default bg-muted px-3 py-2"
            >
              <code tabindex="0" class="min-w-0 flex-1 overflow-x-auto whitespace-pre text-xs text-default">{{ step.value }}</code>
              <UiButton
                :icon="copied && copiedValue === step.value ? 'check' : 'copy'"
                purpose="quiet"
                size="xs"
                class="min-h-11 min-w-11 shrink-0"
                :aria-label="copied && copiedValue === step.value ? `Copied: ${step.title}` : `Copy: ${step.title}`"
                @click="copyValue(step.value)"
              />
            </div>

            <NuxtLink
              v-else
              :to="step.to"
              external
              target="_blank"
              class="mt-2 inline-flex min-h-11 items-center gap-1 text-sm text-primary hover:underline"
            >
              {{ step.label }}
              <UiIcon name="external" class="size-3.5" aria-hidden="true" />
            </NuxtLink>
          </div>
        </li>
      </ol>
    </section>
  </div>
</template>
