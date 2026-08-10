import type { TeamRole } from '../policies/team-policy'

export type ProApiPermission
  = | 'site:read'
    | 'site:write'
    | 'report:read'
    | 'report:write'
    | 'brief:read'
    | 'brief:write'
    | 'mcp:read'
    | 'mcp:write'
    | 'team:read'
    | 'team:write'

export const proApiPermissions = [
  'site:read',
  'site:write',
  'report:read',
  'report:write',
  'brief:read',
  'brief:write',
  'mcp:read',
  'mcp:write',
  'team:read',
  'team:write',
] as const satisfies readonly ProApiPermission[]

export const defaultProApiTokenPermissions = [
  'site:read',
  'report:read',
  'brief:read',
  'mcp:read',
  'team:read',
] as const satisfies readonly ProApiPermission[]

export const proApiRolePermissions = {
  admin: proApiPermissions,
  editor: [
    'site:read',
    'site:write',
    'report:read',
    'report:write',
    'brief:read',
    'brief:write',
    'mcp:read',
    'mcp:write',
    'team:read',
  ],
  viewer: [
    'site:read',
    'report:read',
    'brief:read',
    'mcp:read',
    'team:read',
  ],
} as const satisfies Record<TeamRole, readonly ProApiPermission[]>

export interface ProApiTokenLike {
  role: TeamRole | null
  tokenSource?: 'team-token' | 'user-api-key'
}

export function permissionsForProApiRole(role: TeamRole | null): readonly ProApiPermission[] {
  if (!role)
    return proApiPermissions
  return proApiRolePermissions[role]
}

export function tokenCan(token: ProApiTokenLike, permission: ProApiPermission): boolean {
  return permissionsForProApiRole(token.role).includes(permission)
}
