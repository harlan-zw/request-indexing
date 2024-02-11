import type { H3Event } from 'h3'
import { ServerClient } from 'postmark'

export const WelcomeEmail = `Thanks for trying out Request Indexing.

Here's the deal: You're one of the first to try it out, and I'm excited to have you on board. However, it's early days, and I'm still actively working on the project to make it the best it can be.

I'd love to hear your thoughts on how I can make Request Indexing better for you. If you need any help, have any feedback or feature requests hit reply and let me know.

P.s. You can find the source code for Request Indexing on GitHub: https://github.com/harlan-zw/request-indexing. Feel free to open an issue or a PR.

Cheers
Harlan`

export function sendWelcomeEmail(event: H3Event, email: string) {
  const client = new ServerClient(useRuntimeConfig(event).postmark.apiKey)
  return client.sendEmail({
    From: 'harlan@harlanzw.com',
    Bcc: 'harlan@harlanzw.com',
    To: email,
    Subject: 'Welcome to Request Indexing',
    TextBody: WelcomeEmail,
  })
}
