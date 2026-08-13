// we have 4 processes we want to run
// - nitro task run queue:ads
// - nitro task run queue:default
// - nitro task run queue:gsc

// we need to run them, if they stop we need to restart them
// use execa

import process from 'node:process'
import { execa } from 'execa'

const tasks = [
  'queue:ads',
  'queue:default',
  'queue:gsc',
  'queue:gsc2',
  'queue:gsc3',
  'queue:gsc4',
]

function bootstrapProcess(task) {
  // if it fails, restart it
  const taskProcess = execa('nitro', ['task', 'run', task])
  taskProcess.stdout.pipe(process.stdout)
  taskProcess.stderr.pipe(process.stderr)
  const start = Date.now()
  taskProcess.on('exit', (code, signal) => {
    const end = Date.now()
    if (end - start < 1000) {
      process.stdout.write(`Task ${task} failed to start\n`)
      return
    }
    process.stdout.write(`Task ${task} exited with code ${code} and signal ${signal}\n`)
    // restart the task
    bootstrapProcess(task)
  })
  process.setMaxListeners(50)
  // listen for sigterm and kill processes
  process.on('SIGTERM', () => {
    taskProcess.kill('SIGTERM')
  })
}

async function init() {
  for (const task of tasks) {
    bootstrapProcess(task)
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}

init().then(() => {
  process.stdout.write('ready\n')
})
