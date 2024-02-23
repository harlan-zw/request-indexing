import {
  createGscClientFromEvent,
} from '~/server/app/services/gsc'

export default defineEventHandler(async (event) => {
  const gsc = await createGscClientFromEvent(event)
  return gsc.pages()
})
