import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scratch = resolve(process.argv[2] ?? '')
assert(process.argv[2], 'Pass a prepared scratch directory')
const here = fileURLToPath(new URL('.', import.meta.url))
assert.equal(process.version, 'v24.18.0', 'Use the recorded Node version')
for (const [name, version] of [['googleapis', '181.0.0'], ['nock', '14.0.17']]) {
  assert.equal(JSON.parse(readFileSync(resolve(scratch, 'node_modules', name, 'package.json'))).version, version)
}
function fences(name) {
  return [...readFileSync(new URL(`../../guides/${name}.md`, import.meta.url), 'utf8')
    .matchAll(/```js\n([\s\S]*?)```/g)].map(match => match[1])
}
const [notify, metadata] = fences('google-indexing-api-node-js')
assert.equal(notify, fences('google-indexing-api-tutorial')[0], 'Tutorial and Node examples differ')
const [bulk] = fences('bulk-submit-urls-google-indexing-api')
assert(notify && metadata && bulk, 'Missing executable fences')
writeFileSync(resolve(scratch, 'notify.mjs'), notify)
writeFileSync(resolve(scratch, 'submit-many.mjs'), bulk)
const setupEnd = notify.indexOf('await indexing.urlNotifications.publish(')
assert(setupEnd > 0, 'Cannot identify client setup before publish')
writeFileSync(resolve(scratch, 'metadata.mjs'), `import assert from 'node:assert/strict'\n${notify.slice(0, setupEnd)}${metadata}\nassert.deepEqual(data, {url, latestUpdate:{type:'URL_UPDATED',notifyTime:'2026-09-15T00:00:00Z'}})\n`)
copyFileSync(resolve(here, 'mock.mjs'), resolve(scratch, 'mock.mjs'))
writeFileSync(resolve(scratch, 'urls.txt'), 'https://example.com/jobs/42\nhttps://example.com/jobs/42\nhttps://example.com/jobs/43\n')
for (const mode of ['success', 'failure', 'bulk', 'metadata']) {
  const script = mode === 'bulk' ? 'submit-many.mjs' : mode === 'metadata' ? 'metadata.mjs' : 'notify.mjs'
  const result = spawnSync(process.execPath, ['--import', './mock.mjs', script, mode === 'bulk' ? 'urls.txt' : 'https://example.com/jobs/42'], {
    cwd: scratch,
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, TEST_MODE: mode },
  })
  assert.ifError(result.error)
  assert.equal(result.status, ['failure', 'bulk'].includes(mode) ? 1 : 0, result.stderr)
  if (mode !== 'metadata') {
    const parse = text => text.trim().split('\n').filter(Boolean).map(JSON.parse)
    const accepted = parse(result.stdout)
    const failed = parse(result.stderr)
    assert.equal(accepted.length, mode === 'failure' ? 0 : 1)
    assert.equal(failed.length, mode === 'success' ? 0 : 1)
    if (accepted.length) {
      assert.equal(accepted[0].status, 'notification-accepted')
      assert.equal(accepted[0].url, 'https://example.com/jobs/42')
    }
    if (failed.length) {
      assert.equal(failed[0].status, 'request-failed')
      assert.equal(failed[0].httpStatus, 429)
      assert.deepEqual(failed[0].reasons, ['rateLimitExceeded'])
      assert.equal(failed[0].url, `https://example.com/jobs/${mode === 'bulk' ? '43' : '42'}`)
    }
  }
  process.stdout.write(`${mode}: PASS\n`)
}
