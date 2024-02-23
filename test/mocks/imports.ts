import { resolve } from 'path'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'

export function useStorage() {
  return createStorage({
    driver: fsDriver({
      base: resolve('test/.data'),
    }),
  })
}

export function useRuntimeConfig() {
  return {
    // keymust be 32 chars long
    key: '12345678901234567890123456789012'
  }
}
