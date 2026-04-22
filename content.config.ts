import { defineCollection, defineContentConfig } from '@nuxt/content'
import { defineRobotsSchema } from '@nuxtjs/robots/content'
import { defineSitemapSchema } from '@nuxtjs/sitemap/content'
import { defineOgImageSchema } from 'nuxt-og-image/content'
import { defineSchemaOrgSchema } from 'nuxt-schema-org/content'
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
  robots: defineRobotsSchema(),
  sitemap: defineSitemapSchema(),
  ogImage: defineOgImageSchema(),
  schemaOrg: defineSchemaOrgSchema(),
})

export default defineContentConfig({
  collections: {
    guides: defineCollection({
      schema,
      type: 'page',
      source: {
        include: '**/*.md',
        cwd: 'content/guides',
        prefix: '/',
      },
    }),
  },
})
