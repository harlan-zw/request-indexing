import type {
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
} from '~/server/db/schema'

export async function createGoogleOAuthClient(account: Pick<GoogleAccountsSelect, 'tokens'> & { googleOAuthClient: GoogleOAuthClientsSelect }) {
  const { OAuth2Client } = await import('googleapis-common')
  return new OAuth2Client({
    forceRefreshOnFailure: true,
    credentials: account.tokens,
    clientId: account.googleOAuthClient.clientId,
    clientSecret: account.googleOAuthClient.clientSecret,
  })
}
