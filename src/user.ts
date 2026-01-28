import API, { JSONHTTPError, type RequestOptions } from 'micro-api-client';

import Admin, { type UserData } from './admin';

export interface Token {
  access_token: string;
  expires_at?: number;
  expires_in: number;
  refresh_token: string;
  token_type: 'bearer';
}

const ExpiryMargin = 60 * 1000;
const storageKey = 'gotrue.user';
const refreshPromises: Record<string, Promise<string>> = {};
const forbiddenUpdateAttributes: Record<string, number> = { api: 1, token: 1, audience: 1, url: 1 };
const forbiddenSaveAttributes: Record<string, number> = { api: 1 };
const isBrowser = (): boolean => typeof window !== 'undefined';

export default class User {
  private static currentUser: User | null = null;

  api: API;
  url: string;
  audience?: string;
  token!: Token | null;
  _fromStorage?: boolean;

  // Dynamic user data properties
  id!: string;
  aud!: string;
  email!: string;
  role!: string;
  app_metadata!: Record<string, unknown>;
  user_metadata!: Record<string, unknown>;
  created_at!: string;
  updated_at!: string;
  confirmed_at!: string;

  [key: string]: unknown;

  constructor(api: API, tokenResponse: Token, audience?: string) {
    this.api = api;
    this.url = api.apiURL;
    this.audience = audience;
    this._processTokenResponse(tokenResponse);
    User.currentUser = this;
  }

  static removeSavedSession(): void {
    isBrowser() && localStorage.removeItem(storageKey);
  }

  static recoverSession(apiInstance?: API): User | null {
    if (User.currentUser) {
      return User.currentUser;
    }

    const json = isBrowser() && localStorage.getItem(storageKey);
    if (json) {
      try {
        const data = JSON.parse(json) as { url?: string; token?: Token; audience?: string };
        const { url, token, audience } = data;
        if (!url || !token) {
          return null;
        }

        const api = apiInstance || new API(url, {});
        return new User(api, token, audience)._saveUserData(data as UserData, true);
      } catch (error) {
        console.error(new Error(`Gotrue-js: Error recovering session: ${error}`));
        return null;
      }
    }

    return null;
  }

  get admin(): Admin {
    return new Admin(this);
  }

  update(attributes: Record<string, unknown>): Promise<User> {
    return this._request<UserData>('/user', {
      method: 'PUT',
      body: JSON.stringify(attributes),
    }).then((response) => this._saveUserData(response)._refreshSavedSession());
  }

  jwt(forceRefresh?: boolean): Promise<string> {
    const token = this.tokenDetails();
    if (token === null || token === undefined) {
      return Promise.reject(new Error(`Gotrue-js: failed getting jwt access token`));
    }
    const { expires_at, refresh_token, access_token } = token;
    if (forceRefresh || (expires_at && expires_at - ExpiryMargin < Date.now())) {
      return this._refreshToken(refresh_token);
    }
    return Promise.resolve(access_token);
  }

  logout(): Promise<void> {
    return this._request<void>('/logout', { method: 'POST' })
      .then(this.clearSession.bind(this))
      .catch(this.clearSession.bind(this));
  }

  _refreshToken(refresh_token: string): Promise<string> {
    const existingPromise = refreshPromises[refresh_token];
    if (existingPromise) {
      return existingPromise;
    }

    const promise = this.api
      .request<Token>('/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
      })
      .then((response) => {
        delete refreshPromises[refresh_token];
        this._processTokenResponse(response);
        this._refreshSavedSession();
        // Token is guaranteed to be set by _processTokenResponse
        return (this.token as Token).access_token;
      })
      // eslint-disable-next-line promise/prefer-await-to-callbacks
      .catch((error: Error) => {
        delete refreshPromises[refresh_token];
        this.clearSession();
        throw error;
      });

    refreshPromises[refresh_token] = promise;
    return promise;
  }

  async _request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    options.headers = options.headers || {};

    const aud = options.audience || this.audience;
    if (aud) {
      options.headers['X-JWT-AUD'] = aud;
    }

    try {
      const token = await this.jwt();
      return await this.api.request<T>(path, {
        headers: Object.assign(options.headers, {
          Authorization: `Bearer ${token}`,
        }),
        ...options,
      });
    } catch (error) {
      if (error instanceof JSONHTTPError && error.json) {
        if (error.json.msg) {
          (error as Error).message = error.json.msg;
        } else if (error.json.error) {
          (error as Error).message = `${error.json.error}: ${error.json.error_description}`;
        }
      }
      throw error;
    }
  }

  getUserData(): Promise<User> {
    return this._request<UserData>('/user')
      .then(this._saveUserData.bind(this))
      .then(this._refreshSavedSession.bind(this));
  }

  _saveUserData(attributes: UserData | Record<string, unknown>, fromStorage?: boolean): User {
    for (const key in attributes) {
      if (key in User.prototype || key in forbiddenUpdateAttributes) {
        continue;
      }
      this[key] = (attributes as Record<string, unknown>)[key];
    }
    if (fromStorage) {
      this._fromStorage = true;
    }
    return this;
  }

  _processTokenResponse(tokenResponse: Token): void {
    this.token = tokenResponse;
    try {
      const claims = JSON.parse(urlBase64Decode(tokenResponse.access_token.split('.')[1])) as { exp: number };
      this.token.expires_at = claims.exp * 1000;
    } catch (error) {
      console.error(new Error(`Gotrue-js: Failed to parse tokenResponse claims: ${error}`));
    }
  }

  _refreshSavedSession(): User {
    // only update saved session if we previously saved something
    if (isBrowser() && localStorage.getItem(storageKey)) {
      this._saveSession();
    }
    return this;
  }

  get _details(): Record<string, unknown> {
    const userCopy: Record<string, unknown> = {};
    for (const key in this) {
      if (key in User.prototype || key in forbiddenSaveAttributes) {
        continue;
      }
      userCopy[key] = this[key];
    }
    return userCopy;
  }

  _saveSession(): User {
    isBrowser() && localStorage.setItem(storageKey, JSON.stringify(this._details));
    return this;
  }

  tokenDetails(): Token | null {
    return this.token;
  }

  clearSession(): void {
    User.removeSavedSession();
    this.token = null;
    User.currentUser = null;
  }
}

function urlBase64Decode(str: string): string {
  // From https://jwt.io/js/jwt.js
  let output = str.replace(/-/g, '+').replace(/_/g, '/');
  switch (output.length % 4) {
    case 0:
      break;
    case 2:
      output += '==';
      break;
    case 3:
      output += '=';
      break;
    default:
      throw new Error('Illegal base64url string!');
  }

  // polifyll https://github.com/davidchambers/Base64.js
  const result = window.atob(output);
  try {
    return decodeURIComponent(escape(result));
  } catch {
    return result;
  }
}
