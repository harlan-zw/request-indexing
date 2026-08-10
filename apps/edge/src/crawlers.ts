// AI crawler classifier — pattern set lifted from @nuxtjs/robots.
// We re-declare the patterns here to keep the Worker dependency-free at runtime
// (a Worker bundle is paid for in milliseconds and KV reads). If @nuxtjs/robots
// exposes a tree-shakable runtime export we can switch to importing AI_BOTS
// directly; for now this is the smallest defensible copy.

export type AiCrawlerEngine
  = | 'openai'
    | 'anthropic'
    | 'google'
    | 'apple'
    | 'perplexity'
    | 'bytedance'
    | 'commoncrawl'
    | 'cohere'
    | 'diffbot'

export interface AiCrawlerMatch {
  engine: AiCrawlerEngine
  botName: string
}

interface Pattern {
  needle: string
  engine: AiCrawlerEngine
  botName: string
}

// Lower-cased substring patterns. Order matters only when two patterns could
// match the same UA — more specific first.
const PATTERNS: Pattern[] = [
  { needle: 'oai-searchbot', engine: 'openai', botName: 'oai-searchbot' },
  { needle: 'chatgpt-user', engine: 'openai', botName: 'chatgpt-user' },
  { needle: 'gptbot', engine: 'openai', botName: 'gptbot' },
  { needle: 'claudebot', engine: 'anthropic', botName: 'claudebot' },
  { needle: 'claude-web', engine: 'anthropic', botName: 'claude-web' },
  { needle: 'anthropic-ai', engine: 'anthropic', botName: 'anthropic-ai' },
  { needle: 'anthropic', engine: 'anthropic', botName: 'anthropic' },
  { needle: 'google-extended', engine: 'google', botName: 'google-extended' },
  { needle: 'applebot-extended', engine: 'apple', botName: 'applebot-extended' },
  { needle: 'perplexitybot', engine: 'perplexity', botName: 'perplexitybot' },
  { needle: 'perplexity-user', engine: 'perplexity', botName: 'perplexity-user' },
  { needle: 'bytespider', engine: 'bytedance', botName: 'bytespider' },
  { needle: 'ccbot', engine: 'commoncrawl', botName: 'ccbot' },
  { needle: 'cohere-ai', engine: 'cohere', botName: 'cohere-ai' },
  { needle: 'cohere', engine: 'cohere', botName: 'cohere' },
  { needle: 'diffbot', engine: 'diffbot', botName: 'diffbot' },
]

export function classifyAiCrawler(userAgent: string | null | undefined): AiCrawlerMatch | null {
  if (!userAgent)
    return null
  const ua = userAgent.toLowerCase()
  for (const p of PATTERNS) {
    if (ua.includes(p.needle))
      return { engine: p.engine, botName: p.botName }
  }
  return null
}
