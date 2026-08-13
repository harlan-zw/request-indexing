// Team domain: deep module wrapping a Team row plus closures bound to db/event.
// Callers obtain a TeamWithOps via requireCurrentTeam and invoke verbs as methods
// on the team itself (e.g. ctx.team.audit(...), ctx.team.issueApiToken(...)).
// See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import type { H3Event } from 'h3'
import type { Team, TeamAuditEventKind, TeamRole } from '../database'
import { logWarn } from '~~/shared/logging'
import { logger } from '~~/shared/server/logger'
import { teamApiTokens, teamAuditEvents } from '../database'

// `sendEmail` from the upstream host was deleted during port. Stub to a logger
// call until request-indexing wires Postmark (already a dep in package.json).
async function sendEmail(_event: H3Event, opts: { to: string, subject: string, html: string }) {
  console.warn('[email.send_stub]', { to: opts.to, subject: opts.subject })
}

const TOKEN_PREFIX = 'nsp_team_'

export function generatePlaintextToken(): string {
  const random = crypto.getRandomValues(new Uint8Array(32))
  return TOKEN_PREFIX + Array.from(random, b => b.toString(16).padStart(2, '0')).join('')
}

export async function hashToken(plaintext: string): Promise<string> {
  const data = new TextEncoder().encode(plaintext)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('')
}

export function tokenLast4(plaintext: string): string {
  return plaintext.slice(-4)
}

export interface AuditOpts {
  actorUserId: number | null
  kind: TeamAuditEventKind
  targetType?: string | null
  targetId?: string | null
  metadata?: Record<string, unknown> | null
}

export interface RecordTeamAuditEventOpts extends AuditOpts {
  db: ReturnType<typeof useDrizzle>
  teamId: number
}

/**
 * Best-effort audit insert for callers that don't have a TeamWithOps in hand
 * (e.g. invite-acceptance flow before the user is a member). Prefer
 * `team.audit(...)` from a TeamWithOps when available.
 */
export async function recordTeamAuditEvent(opts: RecordTeamAuditEventOpts): Promise<void> {
  await opts.db.insert(teamAuditEvents).values({
    teamId: opts.teamId,
    actorUserId: opts.actorUserId,
    kind: opts.kind,
    targetType: opts.targetType ?? null,
    targetId: opts.targetId ?? null,
    metadata: opts.metadata ?? null,
  }).catch((err: unknown) => {
    logger.error('[team-audit] insert failed:', err instanceof Error ? err.message : String(err))
  })
}

export interface IssueApiTokenOpts {
  userId: number
  role: TeamRole
  label?: string | null
  expiresAt?: Date | null
}

export interface IssueApiTokenResult {
  plaintext: string
  record: {
    id: number
    label: string | null
    last4: string
    role: TeamRole
    usageCount: number
    lastUsedAt: Date | null
    createdAt: Date | null
    expiresAt: Date | null
  }
}

export interface SendInviteOpts {
  email: string
  role: 'admin' | 'editor' | 'viewer'
  inviterName: string
  acceptUrl: string
  expiresAt: Date
  invitationId: number
}

export interface TeamOps {
  audit: (opts: AuditOpts) => Promise<void>
  issueApiToken: (opts: IssueApiTokenOpts) => Promise<IssueApiTokenResult>
  sendInvite: (opts: SendInviteOpts) => Promise<void>
}

export type TeamWithOps = Team & TeamOps

function escHtml(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
}

interface RenderInviteOpts {
  inviterName: string
  teamName: string
  role: 'admin' | 'editor' | 'viewer'
  acceptUrl: string
  expiresAt: Date
}

function renderInviteEmail(opts: RenderInviteOpts): { subject: string, html: string } {
  const expiresLabel = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(opts.expiresAt)
  const subject = `${opts.inviterName} invited you to ${opts.teamName} on Nuxt SEO Pro`

  const html = `<!doctype html>
<html>
<body style="font-family:system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;background:#fafafa;margin:0;padding:32px 16px;color:#111">
  <table role="presentation" style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden">
    <tr>
      <td style="padding:32px 32px 8px">
        <div style="font-size:14px;color:#666;margin-bottom:8px">Nuxt SEO Pro</div>
        <h1 style="margin:0;font-size:20px;line-height:1.3;color:#111">
          ${escHtml(opts.inviterName)} invited you to <strong>${escHtml(opts.teamName)}</strong>
        </h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 32px 24px">
        <p style="margin:8px 0 0;font-size:14px;color:#444;line-height:1.6">
          You've been invited to join the team as <strong>${escHtml(opts.role)}</strong>.
          Click the button below to accept. This invitation expires on ${escHtml(expiresLabel)}.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px">
        <a href="${escHtml(opts.acceptUrl)}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;font-size:14px">
          Accept invitation
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;border-top:1px solid #eee">
        <p style="margin:24px 0 0;font-size:12px;color:#888;line-height:1.6">
          If the button doesn't work, paste this link into your browser:<br>
          <span style="font-family:ui-monospace,monospace;color:#666;word-break:break-all">${escHtml(opts.acceptUrl)}</span>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#888">
          If you weren't expecting this, you can ignore this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}

/**
 * Wrap a Team row with operations bound to db/event. Closures hold references
 * but no shared mutable state — safe across concurrent requests.
 */
export function attachTeamOps(
  team: Team,
  deps: { db: ReturnType<typeof useDrizzle>, event: H3Event },
): TeamWithOps {
  const { db, event } = deps

  const audit: TeamOps['audit'] = opts => recordTeamAuditEvent({ db, teamId: team.teamId, ...opts })

  const issueApiToken: TeamOps['issueApiToken'] = async (opts) => {
    const plaintext = generatePlaintextToken()
    const tokenHash = await hashToken(plaintext)
    const last4 = tokenLast4(plaintext)

    const inserted = await db.insert(teamApiTokens).values({
      teamId: team.teamId,
      userId: opts.userId,
      tokenHash,
      last4,
      label: opts.label ?? null,
      role: opts.role,
      expiresAt: opts.expiresAt ?? null,
    }).returning().get()

    return {
      plaintext,
      record: {
        id: inserted.teamApiTokenId,
        label: inserted.label,
        last4: inserted.last4,
        role: inserted.role as TeamRole,
        usageCount: inserted.usageCount,
        lastUsedAt: inserted.lastUsedAt,
        createdAt: inserted.createdAt,
        expiresAt: inserted.expiresAt,
      },
    }
  }

  const sendInvite: TeamOps['sendInvite'] = async (opts) => {
    const { subject, html } = renderInviteEmail({
      inviterName: opts.inviterName,
      teamName: team.name,
      role: opts.role,
      acceptUrl: opts.acceptUrl,
      expiresAt: opts.expiresAt,
    })
    // Best-effort: failing email shouldn't roll back invitation row; user can resend or copy link.
    await sendEmail(event, { to: opts.email, subject, html }).catch((err: { message?: string } | undefined) => {
      logWarn('email.send_failed', err, { stage: 'team_invite' })
    })
  }

  return Object.assign(Object.create(null) as Team, team, { audit, issueApiToken, sendInvite }) as TeamWithOps
}
