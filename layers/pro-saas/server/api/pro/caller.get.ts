// Endpoint backing useCaller(). Returns the request-scoped Caller or 401.
// See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import { defineProApiHandler } from '../../utils/handler'

export default defineProApiHandler({}, ({ caller }) => caller)
