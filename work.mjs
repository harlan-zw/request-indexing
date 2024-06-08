// we have 4 processes we want to run
// - nitro task run queue:ads
// - nitro task run queue:default
// - nitro task run queue:gsc
// - nitro task run queue:psi

// we need to run them, if they stop we need to restart them
// use execa

import { execa } from 'execa';

const tasks = [
  'queue:ads',
  'queue:default',
  'queue:gsc',
  'queue:gsc2',
  'queue:gsc3',
  'queue:gsc4',
  'queue:psi',
  'queue:psi2',
];

function bootstrapProcess(task) {
  // if it fails, restart it
  let taskProcess = execa('nitro', ['task', 'run', task]);
  taskProcess.stdout.pipe(process.stdout);
  taskProcess.stderr.pipe(process.stderr);
  const start = Date.now();
  taskProcess.on('exit', (code, signal) => {
    const end = Date.now();
    if (end - start < 1000) {
      console.log(`Task ${task} failed to start`);
      return
    }
    console.log(`Task ${task} exited with code ${code} and signal ${signal}`);
    // restart the task
    bootstrapProcess(task)
  });
  process.setMaxListeners(50)
  // listen for sigterm and kill processes
  process.on('SIGTERM', () => {
    taskProcess.kill('SIGTERM');
  });
}

tasks.forEach(bootstrapProcess)
