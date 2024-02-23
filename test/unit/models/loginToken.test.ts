import { beforeAll, describe, expect, it } from 'vitest'
import { User } from '~/server/app/models/User'
import {createStorage} from "unstorage";
import fsDriver from "unstorage/drivers/fs";
import {resolve} from "path";

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
});

describe('oRM', () => {

  it('can save loginToken', async () => {
    const originalTokens = {
      expiry_date: 12345,
      access_token: 'foo',
      refresh_token: 'bar',
      token_type: 'bearer',
      id_token: 'baz',
      scope: 'test',
    }
    const instance = await User.create({
      userId: '123',
      loginTokens: originalTokens,
    })
    // hash changes each time
    expect(instance.loginTokens).toBeTypeOf('string')

    const user = (await User.find('123'))!
    expect(originalTokens, 'tokens to be decrypted on find').toEqual(user!.loginTokens)
  })
})
