import type {
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
} from '~~/layers/core/server/db/schema'

export async function createGoogleOAuthClient(account: Pick<GoogleAccountsSelect, 'tokens'> & { googleOAuthClient: GoogleOAuthClientsSelect }) {
  // @ts-expect-error - googleapis-common is transitive, types not resolvable directly
  const { OAuth2Client } = await import('googleapis-common')
  return new OAuth2Client({
    forceRefreshOnFailure: true,
    credentials: account.tokens,
    clientId: account.googleOAuthClient.clientId,
    clientSecret: account.googleOAuthClient.clientSecret,
  })
}
