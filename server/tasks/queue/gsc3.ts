import { nextWaitingJob, runJob } from '~/server/plugins/eventServiceProvider'

export default defineTask({
  meta: {
    name: 'queue:gsc3',
    description: 'Works the GSC queue',
  },
  async run() {
    console.log('running task gsc3')
    let shouldQuit = false
    listenForTermination(() => {
      console.log('got sig term')
      shouldQuit = true
    })
    while (true) {
      // get the next job
      const job = await nextWaitingJob('gsc')
      if (job) {
        console.log('processing job', job.jobId, job.name)
        // run the job
        await runJob(job)
      }
      else {
        // sleep for a bit
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      if (shouldQuit) {
        // exit the loop and end the process with status code 0
        process.exit(0)
      }
    }
    return { result: 'OK' }
  },
})

/**
 * Enable async signals for the process.
 *
 * @return void
 */
function listenForTermination(fn: () => void) {
  // check for sigterm, sigusr2, sigcont
  process.on('SIGTERM', fn)
}
