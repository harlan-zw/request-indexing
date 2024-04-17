import { hash } from 'ohash'
import _tokens from '../.tokens.js'

const publicTokens = _tokens.public.map((token) => {
  token.id = hash(token)
  return token
})
const privateTokens = _tokens.private.map((token) => {
  token.id = hash(token)
  return token
})

console.log(`PUBLIC CAPACITY\n ${publicTokens.length * 15}`)
console.log('PUBLIC TOKENS\n', JSON.stringify(publicTokens))
console.log('PRIVATE TOKENS\n', JSON.stringify(privateTokens))
