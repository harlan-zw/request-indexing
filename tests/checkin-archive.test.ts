// @vitest-environment node
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'
import { externalCheckin } from '../shared/checkin-external'

const run = promisify(execFile)
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const cli = resolve(repoRoot, 'node_modules/@harlan-zw/nuxt-checkin/dist/cli/index.mjs')

async function saveArchive() {
  const root = await mkdtemp(join(tmpdir(), 'checkin-archive-'))
  const saveDir = join(root, 'durable-evidence')
  const workspace = join(root, 'worktree')
  await mkdir(workspace)
  const artifact = [
    `import { defineCheck, pass } from ${JSON.stringify(resolve(repoRoot, 'node_modules/@harlan-zw/nuxt-checkin/dist/runtime/external/index.js'))}`,
    'export default [defineCheck({ id: \'fixture.ok\', run: () => pass() })]',
    `export const options = ${JSON.stringify({ save: externalCheckin.save })}`,
    '',
  ].join('\n')
  const artifactPath = join(root, 'artifact.mjs')
  await writeFile(artifactPath, artifact)
  try {
    await run('node', [cli, '--save', '--artifact', artifactPath], { cwd: workspace, env: { ...process.env, DAILY_CHECKIN_DIR: saveDir } })
    await rm(workspace, { recursive: true })
    const files = (await readdir(saveDir)).filter(name => name !== 'state.json')
    expect(files).toHaveLength(1)
    const archive = JSON.parse(await readFile(join(saveDir, files[0]!), 'utf8'))
    expect(archive).toMatchObject({ severity: 'pass', coverage: 'complete' })
    const state = JSON.parse(await readFile(join(saveDir, 'state.json'), 'utf8'))
    expect(state.lastRunAt).toBe(archive.observedAt)
    return files[0]!
  }
  finally {
    await rm(root, { recursive: true, force: true })
  }
}

it('writes the configured archive outside a disposable worktree', async () => {
  const archiveName = await saveArchive()
  expect(archiveName).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z-[0-9a-f-]{36}\.json$/)
})
