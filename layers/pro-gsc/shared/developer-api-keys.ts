// Wire types for the Developers page API keys. gscdump issues and stores the
// keys; Request Indexing only relays them and never stores a raw key.

export interface DeveloperApiKey {
  keyId: string
  preview: string
  label: string
  /** Epoch milliseconds. */
  createdAt: number
  /** Epoch milliseconds, or null when the key was never used. */
  lastUsedAt: number | null
}

export interface CreatedDeveloperApiKey extends Omit<DeveloperApiKey, 'lastUsedAt'> {
  /** The raw key. gscdump returns it once, in the create response only. */
  apiKey: string
}

export type DeveloperApiKeysState
  = | { _tag: 'SearchConsoleRequired' }
    | { _tag: 'Ready', keys: DeveloperApiKey[] }

export const DEVELOPER_API_KEY_LABEL_MAX = 64
export const DEVELOPER_API_KEY_LIMIT = 10
