// Rotate the personal API key on `users.apiKey`. Returns the plaintext once;
// the client must store it. Subsequent reads only expose the masked form via
// `users.apiKey` already in the Caller payload.

import { eq } from 'drizzle-orm'
import { customAlphabet } from 'nanoid'
import { users } from '../../../../database'
import { defineProApiHandler } from '../../../../utils/handler'

const apiKeyAlphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const generateApiKey = customAlphabet(apiKeyAlphabet, 40)

export default defineProApiHandler({ authMethod: 'session' }, async ({ caller }) => {
  const db = useDrizzle()
  const userId = caller.user.id
  const apiKey = generateApiKey()
  await db.update(users).set({ apiKey }).where(eq(users.userId, userId)).run()
  return { apiKey }
})
