import { describe, expect, it } from 'vitest'
import { needsOnboarding, resolveTeamOnboarding } from './onboarding'

describe('resolveTeamOnboarding', () => {
  it('reports a signed-out session', () => {
    expect(resolveTeamOnboarding(undefined)).toEqual({ _tag: 'SignedOut' })
    expect(resolveTeamOnboarding({})).toEqual({ _tag: 'SignedOut' })
  })

  it('reports an absent team instead of reading through it', () => {
    expect(resolveTeamOnboarding({ user: { id: 1 } })).toEqual({ _tag: 'NoTeam' })
    expect(resolveTeamOnboarding({ user: { id: 1 }, team: null })).toEqual({ _tag: 'NoTeam' })
  })

  it('reports a team that has not finished onboarding', () => {
    expect(resolveTeamOnboarding({ user: { id: 1 }, team: { teamId: 7, onboardedStep: null } }))
      .toEqual({ _tag: 'NotOnboarded', teamId: 7 })
  })

  it('reports a finished team with the step it stopped on', () => {
    expect(resolveTeamOnboarding({ user: { id: 1 }, team: { teamId: 7, onboardedStep: 'sites-and-backup' } }))
      .toEqual({ _tag: 'Onboarded', teamId: 7, step: 'sites-and-backup' })
  })
})

describe('needsOnboarding', () => {
  it('sends a user with no team to onboarding', () => {
    expect(needsOnboarding(resolveTeamOnboarding({ user: { id: 1 } }))).toBe(true)
  })

  it('sends an unfinished team to onboarding', () => {
    expect(needsOnboarding(resolveTeamOnboarding({ user: { id: 1 }, team: { teamId: 7, onboardedStep: null } }))).toBe(true)
  })

  it('leaves a finished team alone', () => {
    expect(needsOnboarding(resolveTeamOnboarding({ user: { id: 1 }, team: { teamId: 7, onboardedStep: 'sites-and-backup' } }))).toBe(false)
  })

  it('leaves a signed-out session to the auth middleware', () => {
    expect(needsOnboarding(resolveTeamOnboarding(null))).toBe(false)
  })
})
