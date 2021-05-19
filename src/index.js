import API, { JSONHTTPError } from 'micro-api-client';

import User from './user';

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `/.netlify/identity`;

export default class GoTrue {
  constructor({ APIUrl = defaultApiURL, audience = '', setCookie = false } = {}) {
    if (HTTPRegexp.test(APIUrl)) {
      console.warn(
        'Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely.',
      );
    }

    if (audience) {
      this.audience = audience;
    }

    this.setCookie = setCookie;

    this.api = new API(APIUrl);
  }

  async _request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers['X-JWT-AUD'] = aud;
    }
    try {
      return await this.api.request(path, options);
    } catch (error) {
      if (error instanceof JSONHTTPError && error.json) {
        if (error.json.msg) {
          error.message = error.json.msg;
        } else if (error.json.error) {
          error.message = `${error.json.error}: ${error.json.error_description}`;
        }
      }
      throw error;
    }
  }

  settings() {
    return this._request('/settings');
  }

  signup(email, password, data) {
    return this._request('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data }),
    });
  }

  login(email, password, remember) {
    this._setRememberHeaders(remember);
    return this._request('/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=password&username=${encodeURIComponent(
        email,
      )}&password=${encodeURIComponent(password)}`,
    }).then((response) => {
      User.removeSavedSession();
      return this.createUser(response, remember);
    });
  }

  loginExternalUrl(provider) {
    return `${this.api.apiURL}/authorize?provider=${provider}`;
  }

  confirm(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify('signup', token, remember);
  }

  requestPasswordRecovery(email) {
    return this._request('/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  recover(token, remember) {
    this._setRememberHeaders(remember);
    return this.verify('recovery', token, remember);
  }

  acceptInvite(token, password, remember) {
    this._setRememberHeaders(remember);
    return this._request('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, password, type: 'signup' }),
    }).then((response) => this.createUser(response, remember));
  }

  acceptInviteExternalUrl(provider, token) {
    return `${this.api.apiURL}/authorize?provider=${provider}&invite_token=${token}`;
  }

  createUser(tokenResponse, remember = false) {
    this._setRememberHeaders(remember);
    const user = new User(this.api, tokenResponse, this.audience);
    return user.getUserData().then((userData) => {
      if (remember) {
        userData._saveSession();
      }
      return userData;
    });
  }

  currentUser() {
    const user = User.recoverSession(this.api);
    user && this._setRememberHeaders(user._fromStorage);
    return user;
  }

  verify(type, token, remember) {
    this._setRememberHeaders(remember);
    return this._request('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, type }),
    }).then((response) => this.createUser(response, remember));
  }

  _setRememberHeaders(remember) {
    if (this.setCookie) {
      this.api.defaultHeaders = this.api.defaultHeaders || {};
      this.api.defaultHeaders['X-Use-Cookie'] = remember ? '1' : 'session';
    }
  }
}

if (typeof window !== 'undefined') {
  window.GoTrue = GoTrue;
}
