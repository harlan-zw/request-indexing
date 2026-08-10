// @ts-expect-error - local untracked file
import _tokens from '../.tokens.js'

console.log(`PUBLIC CAPACITY\n ${_tokens.length * 15}`)
console.log('TOKENS\n', JSON.stringify(_tokens))
