import { getQuery } from 'h3'
import { $fetch } from 'ofetch'

export interface GitHubRepo {
  id: number
  name: string
  repo: string
  description: string
  createdAt: string
  updatedAt: string
  pushedAt: string
  stars: number
  watchers: number
  forks: number
}

const cachedGitHubRepo = cachedFunction<GitHubRepo, [string]>(
  repo => $fetch(`https://ungh.cc/repos/${repo}`).then(r => r.repo as GitHubRepo),
  {
    base: 'app',
    maxAge: 60 * 60,
    group: 'app/cache',
    name: 'github-repo',
    getKey: (repo: string) => repo,
  },
)

export default defineEventHandler(async (event) => {
  const repoWithOwner = getQuery(event).repo as string

  if (!repoWithOwner)
    return sendError(event, new Error('Missing repo name.'))

  return cachedGitHubRepo(repoWithOwner)
})
