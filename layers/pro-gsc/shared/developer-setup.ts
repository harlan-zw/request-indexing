// Setup steps for the Developers page. Each command exists twice: `display`
// masks the API key for the screen, and `copy` holds the full key for the
// clipboard. Before a key exists, both show the same placeholder.

export type SetupMethod = 'cli' | 'mcp' | 'api'

export const API_KEY_PLACEHOLDER = '$GSCDUMP_API_KEY'
// Cursor reads an environment variable with this syntax, so the placeholder
// config works as written once GSCDUMP_API_KEY is set.
// eslint-disable-next-line no-template-curly-in-string
const CURSOR_ENV_API_KEY = '${env:GSCDUMP_API_KEY}'
export const SITE_ID_PLACEHOLDER = 's_your_site'
export const GSCDUMP_MCP_URL = 'https://gscdump.com/mcp'
export const GSCDUMP_API_ROOT = 'https://gscdump.com/api'

export interface ApiKeyPresentation {
  display: string
  copy: string
}

export interface SetupCommand {
  display: string
  copy: string
}

export type SetupStep
  = | { _tag: 'command', title: string, body: string, command: SetupCommand }
    | { _tag: 'api-key', title: string, body: string }
    | { _tag: 'link', title: string, body: string, to: string, label: string }

/** Keep the raw key out of visible markup. Only the clipboard gets it. */
export function presentApiKey(apiKey: string | null): ApiKeyPresentation {
  if (!apiKey)
    return { display: API_KEY_PLACEHOLDER, copy: API_KEY_PLACEHOLDER }
  return { display: `${apiKey.slice(0, 9)}••••${apiKey.slice(-4)}`, copy: apiKey }
}

function command(render: (apiKey: string) => string, key: ApiKeyPresentation): SetupCommand {
  return { display: render(key.display), copy: render(key.copy) }
}

const API_KEY_STEP_BODY = 'Create a key in API keys above. The commands below then include it.'

export function buildSetupSteps(method: SetupMethod, apiKey: string | null, siteId: string | null): SetupStep[] {
  const key = presentApiKey(apiKey)

  if (method === 'mcp') {
    return [
      {
        _tag: 'command',
        title: 'Claude.ai or ChatGPT',
        body: 'Enter this URL as a custom connector. Then sign in to gscdump with the Google account you use here. No API key is necessary.',
        command: command(() => GSCDUMP_MCP_URL, key),
      },
      { _tag: 'api-key', title: 'Create an API key', body: `Claude Code, Cursor, and other clients send an API key in a header. ${API_KEY_STEP_BODY}` },
      {
        _tag: 'command',
        title: 'Claude Code',
        body: 'Run this command in a terminal.',
        command: command(k => `claude mcp add --transport http gscdump ${GSCDUMP_MCP_URL} --header "x-api-key: ${k}"`, key),
      },
      {
        _tag: 'command',
        title: 'Cursor and other clients',
        body: 'Add this server to the MCP config file of the client. For Cursor, the file is ~/.cursor/mcp.json.',
        command: command(k => JSON.stringify({
          mcpServers: {
            gscdump: {
              url: GSCDUMP_MCP_URL,
              headers: { 'x-api-key': k === API_KEY_PLACEHOLDER ? CURSOR_ENV_API_KEY : k },
            },
          },
        }, null, 2), key),
      },
    ]
  }

  if (method === 'api') {
    const site = siteId ?? SITE_ID_PLACEHOLDER
    return [
      { _tag: 'api-key', title: 'Create an API key', body: API_KEY_STEP_BODY },
      {
        _tag: 'command',
        title: 'Query your top queries',
        body: siteId
          ? 'This request reads the search queries for your first connected Site. Send the key as a bearer token.'
          : 'Connect a Site first. Then replace s_your_site with its gscdump Site ID.',
        command: command(k => [
          `curl -X POST ${GSCDUMP_API_ROOT}/analytics/v1/sites/${site}/reports \\`,
          `  -H "Authorization: Bearer ${k}" \\`,
          '  -H "Content-Type: application/json" \\',
          `  -d '{"state":{"dimensions":["query"],"searchType":"web"}}'`,
        ].join('\n'), key),
      },
      {
        _tag: 'link',
        title: 'Browse every operation',
        body: 'The hosted API guide lists each route, credential, and error.',
        to: 'https://github.com/harlan-zw/gscdump/blob/main/docs/hosted-api-v1.md',
        label: 'Read the API guide',
      },
    ]
  }

  return [
    {
      _tag: 'command',
      title: 'Install the CLI',
      body: 'Use Node.js 22.13 or later.',
      command: command(() => 'npm install -g @gscdump/cli', key),
    },
    { _tag: 'api-key', title: 'Create an API key', body: API_KEY_STEP_BODY },
    {
      _tag: 'command',
      title: 'Sign in',
      body: 'The CLI saves the key. Do this once on each machine.',
      command: command(k => `GSCDUMP_API_KEY=${k} gscdump auth login --mode cloud`, key),
    },
    {
      _tag: 'command',
      title: 'List your Sites',
      body: 'Every command has --help.',
      command: command(() => 'gscdump sites', key),
    },
  ]
}
