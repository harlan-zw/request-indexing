// Single source of truth for "what avatar to render for this user record."
// Reads `avatarUrl` set by an endpoint that JOINed user_identities. Returns
// undefined when no avatar is stored; UAvatar then falls back to initials.

interface AvatarSource {
  avatarUrl?: string | null
}

export function userAvatarUrl(user: AvatarSource | null | undefined, _size?: number): string | undefined {
  return user?.avatarUrl ?? undefined
}
