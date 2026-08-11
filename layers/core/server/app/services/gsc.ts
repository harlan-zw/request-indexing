import type {
  GoogleAccountsSelect,
  GoogleOAuthClientsSelect,
} from '~~/layers/core/server/db/schema'
import { OAuth2Client } from 'googleapis-common'

export async function createGoogleOAuthClient(account: Pick<GoogleAccountsSelect, 'tokens'> & { googleOAuthClient: GoogleOAuthClientsSelect }) {
  return new OAuth2Client({
    forceRefreshOnFailure: true,
    credentials: account.tokens,
    clientId: account.googleOAuthClient.clientId,
    clientSecret: account.googleOAuthClient.clientSecret,
  })
}
