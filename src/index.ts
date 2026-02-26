import API, { JSONHTTPError, type RequestOptions } from './api';
import User, { type Token } from './user';

export type { Token, AppMetadata } from './user';
export type { UserData, UserAttributes } from './admin';
export { default as User } from './user';
export { default as Admin } from './admin';
export { HTTPError, JSONHTTPError, TextHTTPError } from './api';

export interface GoTrueInit {
  APIUrl?: string;
  audience?: string;
  setCookie?: boolean;
  clientName?: string;
}

export interface Settings {
  autoconfirm: boolean;
  disable_signup: boolean;
  external: {
    bitbucket: boolean;
    email: boolean;
    facebook: boolean;
    github: boolean;
    gitlab: boolean;
    google: boolean;
  };
}

export interface SignupResponse {
  id: string;
  email: string;
  confirmation_sent_at?: string;
  confirmed_at?: string;
  [key: string]: unknown;
}

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `/.netlify/identity`;

export default class GoTrue {
  audience?: string;
  setCookie: boolean;
  api: API;

  constructor({
    APIUrl = defaultApiURL,
    audience = '',
    setCookie = false,
    clientName = 'gotrue-js',
  }: GoTrueInit = {}) {
    if (HTTPRegexp.test(APIUrl)) {
      console.warn(
        'Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely.',
      );
    }

    if (audience) {
      this.audience = audience;
    }

    this.setCookie = setCookie;
    this.api = new API(APIUrl, { defaultHeaders: { 'X-Nf-Client': clientName } });
  }

  async _request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers['X-JWT-AUD'] = aud;
    }
    try {
      return await this.api.request<T>(path, options);
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

  settings(): Promise<Settings> {
    return this._request<Settings>('/settings');
  }

  signup(email: string, password: string, data?: Record<string, unknown>): Promise<SignupResponse> {
    return this._request('/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data }),
    });
  }

  login(email: string, password: string, remember?: boolean): Promise<User> {
    this._setRememberHeaders(remember);
    return this._request<Token>('/token', {
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

  loginExternalUrl(provider: string): string {
    return `${this.api.apiURL}/authorize?provider=${provider}`;
  }

  confirm(token: string, remember?: boolean): Promise<User> {
    this._setRememberHeaders(remember);
    return this.verify('signup', token, remember);
  }

  requestPasswordRecovery(email: string): Promise<void> {
    return this._request('/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  recover(token: string, remember?: boolean): Promise<User> {
    this._setRememberHeaders(remember);
    return this.verify('recovery', token, remember);
  }

  acceptInvite(token: string, password: string, remember?: boolean): Promise<User> {
    this._setRememberHeaders(remember);
    return this._request<Token>('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, password, type: 'signup' }),
    }).then((response) => this.createUser(response, remember));
  }

  acceptInviteExternalUrl(provider: string, token: string): string {
    return `${this.api.apiURL}/authorize?provider=${provider}&invite_token=${token}`;
  }

  createUser(tokenResponse: Token, remember = false): Promise<User> {
    this._setRememberHeaders(remember);
    const user = new User(this.api, tokenResponse, this.audience || '');
    return user.getUserData().then((userData) => {
      if (remember) {
        userData._saveSession();
      }
      return userData;
    });
  }

  currentUser(): User | null {
    const user = User.recoverSession(this.api);
    user && this._setRememberHeaders(user._fromStorage);
    return user;
  }

  async validateCurrentSession(): Promise<User | null> {
    const user = this.currentUser();
    if (!user) {
      return null;
    }
    try {
      return await user.getUserData();
    } catch {
      user.clearSession();
      return null;
    }
  }

  verify(type: string, token: string, remember?: boolean): Promise<User> {
    this._setRememberHeaders(remember);
    return this._request<Token>('/verify', {
      method: 'POST',
      body: JSON.stringify({ token, type }),
    }).then((response) => this.createUser(response, remember));
  }

  _setRememberHeaders(remember?: boolean): void {
    if (this.setCookie) {
      this.api.defaultHeaders = this.api.defaultHeaders || {};
      this.api.defaultHeaders['X-Use-Cookie'] = remember ? '1' : 'session';
    }
  }
}

if (typeof window !== 'undefined') {
  (window as Window & { GoTrue: typeof GoTrue }).GoTrue = GoTrue;
}

declare global {
  interface Window {
    GoTrue: typeof GoTrue;
  }
}
