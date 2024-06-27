import { resolve } from 'path'
import { beforeAll, describe, expect, it } from 'vitest'
import { createStorage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import { User } from '~/server/app/models/User'

beforeAll(() => {
  global.useStorage = () => {
    return createStorage({
      driver: fsDriver({
        base: resolve('test/.data'),
      }),
    })
  }
  global.useRuntimeConfig = () => {
    return {
      // keymust be 32 chars long
      key: '12345678901234567890123456789012',
    }
  }
})

describe('oRM', () => {
  it('can augment with functions', () => {
    const instance = User.newModelInstance()
    expect(instance.foo()).toMatchInlineSnapshot(`"bar"`)
  })
  it('can augment with functions on create', async () => {
    const instance = await User.create({
      userId: 'foo-123',
    })
    expect(instance.foo()).toMatchInlineSnapshot(`"bar"`)
  })
  it('create an load user', async () => {
    const user = await User.create({
      userId: '123',
      email: 'test@test.com',
    })
    await user.save()

    expect({ ...(await User.find('123'))!.getAttributes(), createdAt: undefined }).toMatchInlineSnapshot(`
      {
        "createdAt": undefined,
        "email": "test@test.com",
        "userId": "123",
      }
    `)
  })
  it('update a user', async () => {
    const user = await User.create({
      userId: '123',
      email: 'test@test.com',
    })
    user.email = 'test2@test.com'
    await user.save()
    expect((await User.find('123'))!.email).toEqual('test2@test.com')
  })
  it('array update a user', async () => {
    const user = await User.create({
      userId: '123',
      selectedSites: ['foo'],
    })
    await user.save()
    expect(user.getAttributes().selectedSites).toMatchInlineSnapshot(`
      [
        "foo",
      ]
    `)
    const user2 = await User.find('123')
    user2!.selectedSites!.push('bar')
    await user2!.save()
    expect(user2!.selectedSites).toEqual(['foo', 'bar'])
    const user3 = await User.find('123')
    user3!.fill({
      selectedSites: ['baz'],
    })
    await user3!.save()
    expect(user3!.selectedSites).toMatchInlineSnapshot(`
      [
        "baz",
      ]
    `)
  })
})
