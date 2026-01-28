import { Buffer } from 'buffer';

import { test, expect, vi } from 'vitest';

import User from '../src/user';

// mock window
global.window = { atob: (base64) => Buffer.from(base64, 'base64').toString('ascii') };

test('should parse token in ctor', () => {
  //
  // {
  // "sub": "1234567890",
  // "name": "John Doe",
  // "iat": 1516239022,
  // "exp": 1000
  // }
  //
  const tokenResponse = {
    access_token:
      'header.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjEwMDB9.secret',
  };
  const user = new User({}, tokenResponse, '');

  expect(user.token.expires_at).toBe(1_000_000);
});

test('should not log token on error', () => {
  const errorSpy = vi.spyOn(console, 'error');
  const tokenResponse = {
    access_token: 'header.invalid.secret',
  };

  // eslint-disable-next-line no-new
  new User({}, tokenResponse, '');

  expect(errorSpy).toHaveBeenCalledOnce();
  const [[error]] = errorSpy.mock.calls;
  expect(error).toBeInstanceOf(Error);
  expect(error.message).not.toContain(tokenResponse.access_token);
});
