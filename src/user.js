import API from "micro-api-client";
import Admin from "./admin";

const ExpiryMargin = 60 * 1000;
const storageKey = "gotrue.user";
let currentUser = null;

export default class User {
  constructor(api, tokenResponse, audience) {
    this.api = api;
    this.processTokenResponse(tokenResponse);
    this.audience = audience;
    this.admin = new Admin(this);
  }

  static recoverSession() {
    if (currentUser) {
      return currentUser;
    }

    const json = localStorage.getItem(storageKey);
    if (json) {
      const data = JSON.parse(json);
      const api = new API(data.api.apiURL);
      return new User(api, data.tokenResponse).process(data);
    }

    return null;
  }

  update(attributes) {
    return this.request("/user", {
      method: "PUT",
      body: JSON.stringify(attributes)
    }).then(response => {
      for (var key in response) {
        this[key] = response[key];
      }
      return this;
    });
  }

  jwt() {
    const { jwt_expiry, refreshToken, jwt_token } = this.tokenDetails();
    if (jwt_expiry - ExpiryMargin < new Date().getTime()) {
      return this.api
        .request("/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=refresh_token&refresh_token=${refreshToken}`
        })
        .then(response => {
          this.processTokenResponse(response);
          this.refreshPersistedSession(this);
          return this.jwt_token;
        })
        .catch(error => {
          console.error("failed to refresh token: %o", error);
          this.persistSession(null);
          this.jwt_expiry = this.refreshToken = this.jwt_token = null;
          return Promise.reject(error);
        });
    }
    return Promise.resolve(jwt_token);
  }

  logout() {
    return this.request("/logout", { method: "POST" })
      .then(this.clearSession.bind(this))
      .catch(this.clearSession.bind(this));
  }

  request(path, options) {
    options = options || {};
    options.headers = options.headers || {};

    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }

    return this.jwt().then(token =>
      this.api.request(path, {
        headers: Object.assign(options.headers, {
          Authorization: `Bearer ${token}`
        }),
        ...options
      })
    );
  }

  reload() {
    return this.request("/user")
      .then(this.process.bind(this))
      .then(this.refreshPersistedSession.bind(this));
  }

  process(attributes) {
    for (var key in attributes) {
      if (key in User.prototype || key == "api") {
        continue;
      }
      this[key] = attributes[key];
    }
    return this;
  }

  processTokenResponse(tokenResponse) {
    this.tokenResponse = tokenResponse;
    this.refreshToken = tokenResponse.refresh_token;
    this.jwt_token = tokenResponse.access_token;
    this.jwt_expiry = Date.now() + tokenResponse.expires_in * 1000;
  }

  refreshPersistedSession(user) {
    currentUser = user;
    if (localStorage.getItem(storageKey)) {
      this.persistSession(user);
    }
    return user;
  }

  persistSession(user) {
    currentUser = user;
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKey);
    }
    return user;
  }

  tokenDetails() {
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage) {
      return JSON.parse(fromStorage);
    }
    return {
      expires_in: this.expires_in,
      refreshToken: this.refreshToken,
      jwt_token: this.jwt_token
    };
  }

  clearSession() {
    localStorage.removeItem(storageKey);
  }
}
