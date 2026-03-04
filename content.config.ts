import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSeoCollection } from '@nuxtjs/seo/content'
import { z } from 'zod'

const schema = z.object({
  icon: z.string().optional(),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  readTime: z.string().optional(),
  relatedPages: z.array(z.object({
    path: z.string(),
    title: z.string(),
  })).optional(),
})

export default defineContentConfig({
  collections: {
    guides: defineCollection(asSeoCollection({
      schema,
      type: 'page',
      source: {
        include: '**/*.md',
        cwd: 'content/guides',
        prefix: '/',
      },
    })),
  },
})
