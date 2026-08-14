declare const __brand: unique symbol
export type Brand<T, B extends string> = T & { readonly [__brand]: B }
export type UserId = Brand<string, 'UserId'>
export type TeamId = Brand<string, 'TeamId'>
export type SiteId = Brand<string, 'SiteId'>
export type InvitationId = Brand<string, 'InvitationId'>
export type ApiTokenId = Brand<string, 'ApiTokenId'>

export const asUserId = (s: string) => s as UserId
export const asTeamId = (s: string) => s as TeamId
export const asSiteId = (s: string) => s as SiteId
export const asInvitationId = (s: string) => s as InvitationId
export const asApiTokenId = (s: string) => s as ApiTokenId
