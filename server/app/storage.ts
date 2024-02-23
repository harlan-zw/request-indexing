import { prefixStorage } from 'unstorage'

export const appStorage = prefixStorage(useStorage(), 'app')
