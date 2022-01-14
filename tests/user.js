import { Buffer } from 'buffer';

import test from 'ava';
import { spy } from 'sinon';

import User from '../src/user';

// mock window
global.window = { atob: (base64) => Buffer.from(base64, 'base64').toString('ascii') };

test('should parse token in ctor', (t) => {
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

  t.is(user.token.expires_at, 1_000_000);
});

test.serial('should not log token on error', (t) => {
  const errorSpy = spy(console, 'error');
  const tokenResponse = {
    access_token: 'header.invalid.secret',
  };

  // eslint-disable-next-line no-new
  new User({}, tokenResponse, '');

  t.assert(errorSpy.calledOnce);
  const [error] = errorSpy.getCall(0).args;
  t.true(error instanceof Error);
  t.false(error.message.includes(tokenResponse.access_token));
});
