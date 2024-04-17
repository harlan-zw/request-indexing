import { defineEventHandler } from 'h3'
import {
  createGscClientFromEvent,
} from '~/server/app/services/gsc'

export default defineEventHandler(async (event) => {
  const gsc = await createGscClientFromEvent(event)
  return gsc.analytics()
})
