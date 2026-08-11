import type { H3Event } from 'h3'
import { z } from 'zod'

export const requestEventSchema = z.custom<H3Event>(value => (
  typeof value === 'object'
  && value !== null
  && 'context' in value
))

export const idSchema = z.number().int().positive()

export const integrationKindSchema = z.enum([
  'gscdump',
  'stripe',
  'github',
  'google',
  'resend',
])
