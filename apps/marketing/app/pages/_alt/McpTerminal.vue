<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'

interface Tab {
  id: string
  label: string
  icon: string
  chrome: string
}

const tabs: Tab[] = [
  { id: 'claude', label: 'Claude Code', icon: 'i-simple-icons-anthropic', chrome: 'claude code · mcp://requestindexing' },
  { id: 'cursor', label: 'Cursor', icon: 'i-simple-icons-cursor', chrome: 'cursor · mcp://requestindexing' },
  { id: 'curl', label: 'curl', icon: 'i-heroicons-command-line', chrome: 'sh · POST /mcp' },
]

const active = ref<Tab['id']>('claude')
const activeTab = computed(() => tabs.find(t => t.id === active.value)!)

// Snippets per transport. Plain text for clipboard.
const snippets: Record<string, string> = {
  claude: `// 1. ask
agent.prompt("perplexity citations diff vs last week, submit updated")

// 2. agent dispatches typed MCP calls
await mcp.call('citations.diff', { engine: 'perplexity', since: '7d' })
await mcp.call('urls.submit', { filter: 'changed-since-deploy' })

// 3. typed result, machine-readable
{
  added:    [ '/learn/mastering-meta/title', '/sitemap/best-practices' ],
  dropped:  [ '/blog/v3-launch' ],
  submitted: 7,
}`,
  cursor: `// 1. ask
cursor.chat("perplexity citations diff vs last week, submit updated")

// 2. cursor dispatches typed MCP calls
const diff = await mcp.invoke('citations.diff', { engine: 'perplexity', since: '7d' })
const out  = await mcp.invoke('urls.submit',   { filter: 'changed-since-deploy' })

// 3. typed result, machine-readable
{
  added:    [ '/learn/mastering-meta/title', '/sitemap/best-practices' ],
  dropped:  [ '/blog/v3-launch' ],
  submitted: 7,
}`,
  curl: `# 1. ask the engine directly
curl https://edge.requestindexing.com/mcp \\
  -H "authorization: Bearer $RI_TOKEN" \\
  -d '{ "tool": "citations.diff", "args": { "engine": "perplexity", "since": "7d" } }'

# 2. submit changed pages
curl https://edge.requestindexing.com/mcp \\
  -d '{ "tool": "urls.submit", "args": { "filter": "changed-since-deploy" } }'

# 3. typed result
{ "added": ["/learn/mastering-meta/title"], "dropped": ["/blog/v3-launch"], "submitted": 7 }`,
}

const currentSnippet = computed(() => snippets[active.value])
const { copy, copied, isSupported } = useClipboard({ source: currentSnippet, copiedDuring: 1600 })

const tools = ['citations.diff', 'urls.submit', 'crawlers.list', 'archive.export']
</script>

<template>
  <div>
    <!-- Tabbed transport switcher -->
    <div class="flex items-center gap-1 mb-3" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        role="tab"
        :aria-selected="active === t.id"
        class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="active === t.id
          ? 'bg-primary/10 text-primary'
          : 'text-muted hover:text-default hover:bg-muted/50'"
        @click="active = t.id"
      >
        <UIcon :name="t.icon" class="size-3.5" />
        {{ t.label }}
      </button>
    </div>

    <div class="rounded-2xl border border-default bg-elevated shadow-2xl shadow-primary-500/10 overflow-hidden">
      <!-- Terminal chrome (no traffic-light dots) -->
      <div class="px-5 py-3 border-b border-default flex items-center justify-between bg-muted/40">
        <div class="flex items-center gap-2.5 text-xs min-w-0">
          <UIcon :name="activeTab.icon" class="size-3.5 text-muted shrink-0" />
          <span class="text-muted font-mono truncate">{{ activeTab.chrome }}</span>
        </div>
        <UBadge color="primary" variant="subtle" size="xs">
          typed
        </UBadge>
      </div>

      <!-- Body -->
      <div class="relative">
        <ClientOnly>
          <button
            v-if="isSupported"
            type="button"
            class="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md border border-default bg-elevated/80 backdrop-blur px-2 py-1 text-[11px] font-medium text-muted hover:text-default hover:border-primary/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary z-10"
            :aria-label="copied ? 'Copied' : 'Copy snippet'"
            @click="copy()"
          >
            <UIcon
              :name="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'"
              class="size-3.5"
              :class="copied ? 'text-primary' : ''"
            />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </ClientOnly>

        <!-- Claude / Cursor: JS-style -->
        <pre
          v-if="active === 'claude'"
          class="px-5 py-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto"
        ><code><span class="text-muted">// 1. ask</span>
<span class="text-default">agent</span>.<span class="text-default">prompt</span>(<span class="text-toned">"perplexity citations diff vs last week, submit updated"</span>)

<span class="text-muted">// 2. agent dispatches typed MCP calls</span>
<span class="text-primary">await</span> <span class="text-default">mcp</span>.<span class="text-default">call</span>(<span class="text-toned">'citations.diff'</span>, { engine: <span class="text-toned">'perplexity'</span>, since: <span class="text-toned">'7d'</span> })
<span class="text-primary">await</span> <span class="text-default">mcp</span>.<span class="text-default">call</span>(<span class="text-toned">'urls.submit'</span>, { filter: <span class="text-toned">'changed-since-deploy'</span> })

<span class="text-muted">// 3. typed result, machine-readable</span>
{
  added:    [ <span class="text-toned">'/learn/mastering-meta/title'</span>, <span class="text-toned">'/sitemap/best-practices'</span> ],
  dropped:  [ <span class="text-toned">'/blog/v3-launch'</span> ],
  submitted: <span class="text-primary">7</span>,
}</code></pre>

        <pre
          v-else-if="active === 'cursor'"
          class="px-5 py-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto"
        ><code><span class="text-muted">// 1. ask</span>
<span class="text-default">cursor</span>.<span class="text-default">chat</span>(<span class="text-toned">"perplexity citations diff vs last week, submit updated"</span>)

<span class="text-muted">// 2. cursor dispatches typed MCP calls</span>
<span class="text-primary">const</span> <span class="text-default">diff</span> = <span class="text-primary">await</span> <span class="text-default">mcp</span>.<span class="text-default">invoke</span>(<span class="text-toned">'citations.diff'</span>, { engine: <span class="text-toned">'perplexity'</span>, since: <span class="text-toned">'7d'</span> })
<span class="text-primary">const</span> <span class="text-default">out</span>  = <span class="text-primary">await</span> <span class="text-default">mcp</span>.<span class="text-default">invoke</span>(<span class="text-toned">'urls.submit'</span>,   { filter: <span class="text-toned">'changed-since-deploy'</span> })

<span class="text-muted">// 3. typed result, machine-readable</span>
{
  added:    [ <span class="text-toned">'/learn/mastering-meta/title'</span>, <span class="text-toned">'/sitemap/best-practices'</span> ],
  dropped:  [ <span class="text-toned">'/blog/v3-launch'</span> ],
  submitted: <span class="text-primary">7</span>,
}</code></pre>

        <!-- curl: shell-style -->
        <pre
          v-else
          class="px-5 py-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto"
        ><code><span class="text-muted"># 1. ask the engine directly</span>
<span class="text-primary">curl</span> <span class="text-toned">https://edge.requestindexing.com/mcp</span> \
  -H <span class="text-toned">"authorization: Bearer $RI_TOKEN"</span> \
  -d <span class="text-toned">'{ "tool": "citations.diff", "args": { "engine": "perplexity", "since": "7d" } }'</span>

<span class="text-muted"># 2. submit changed pages</span>
<span class="text-primary">curl</span> <span class="text-toned">https://edge.requestindexing.com/mcp</span> \
  -d <span class="text-toned">'{ "tool": "urls.submit", "args": { "filter": "changed-since-deploy" } }'</span>

<span class="text-muted"># 3. typed result</span>
{ <span class="text-default">"added"</span>: [<span class="text-toned">"/learn/mastering-meta/title"</span>], <span class="text-default">"dropped"</span>: [<span class="text-toned">"/blog/v3-launch"</span>], <span class="text-default">"submitted"</span>: <span class="text-primary">7</span> }</code></pre>
      </div>
    </div>

    <!-- Footer: available MCP tools -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <span class="text-xs text-muted font-semibold uppercase tracking-[0.18em] mr-1">
        Tools
      </span>
      <span
        v-for="tool in tools"
        :key="tool"
        class="inline-flex items-center gap-1.5 rounded-md border border-default bg-muted/30 px-2 py-1 font-mono text-[11px] text-toned"
      >
        <span class="size-1 rounded-full bg-primary/60" />
        {{ tool }}
      </span>
    </div>
  </div>
</template>
