import type { H3Event } from 'h3'

export interface BlobObject {
  pathname: string
  contentType?: string
  size: number
  uploadedAt: Date
}

function getR2Bucket(event?: H3Event): R2Bucket {
  if (event) {
    const bucket = (event.context.cloudflare?.env as { BLOB?: R2Bucket })?.BLOB
    if (bucket)
      return bucket
  }

  // @ts-expect-error - globalThis may have cloudflare context
  const globalBucket = globalThis.__env__?.BLOB || globalThis.BLOB
  if (globalBucket)
    return globalBucket

  throw new Error('R2 bucket not available. Make sure BLOB binding is configured in wrangler.toml')
}

export function useBlob(event?: H3Event) {
  const bucket = getR2Bucket(event)

  return {
    async put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { contentType?: string }): Promise<BlobObject> {
      const result = await bucket.put(key, value, {
        httpMetadata: options?.contentType ? { contentType: options.contentType } : undefined,
      })

      return {
        pathname: key,
        contentType: options?.contentType,
        size: result?.size ?? 0,
        uploadedAt: result?.uploaded ?? new Date(),
      }
    },

    async get(key: string): Promise<R2ObjectBody | null> {
      return bucket.get(key)
    },

    async delete(key: string): Promise<void> {
      await bucket.delete(key)
    },

    async list(options?: { prefix?: string, limit?: number, cursor?: string }) {
      return bucket.list({
        prefix: options?.prefix,
        limit: options?.limit,
        cursor: options?.cursor,
      })
    },

    async head(key: string): Promise<R2Object | null> {
      return bucket.head(key)
    },
  }
}
