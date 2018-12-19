import API, { JSONHTTPError } from "micro-api-client";
import User from "./user";

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `/.netlify/identity`;

export default class GoTrue {
  constructor({
    APIUrl = defaultApiURL,
    audience = "",
    setCookie = false
  } = {}) {
    if (APIUrl.match(HTTPRegexp)) {
      console.warn(
        "Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."
      );
    }

    if (audience) {
      this.audience = audience;
    }

    this.setCookie = setCookie;

    this.api = new API(APIUrl);
  }

  _request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }
    return this.api.request(path, options).catch(err => {
      if (err instanceof JSONHTTPError && err.json) {
        if (err.json.msg) {
          err.message = err.json.msg;
        } else if (err.json.error) {
          err.message = `${err.json.error}: ${err.json.error_description}`;
        }
      }
      return Promise.reject(err);
    });
  }

  settings() {
    return this._request("/settings");
  }

  signup(email, password, data) {
    if (typeof email === 'object' && email.password) {
      data = email.data;
      password = email.password;
      email = email.email;
    }
    return this._request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data })
    });
  }

  login(email, password, remember) {
    if (typeof email === 'object' && email.password) {
      remember = email.remember;
      password = email.password;
      email = email.email;
    }
    this._setRememberHeaders(remember);
    return this._request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=password&username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`
    }).then(response => {
      User.removeSavedSession();
      return this.createUser(response, remember);
    });
  }

  loginExternalUrl(provider) {
    return `${this.api.apiURL}/authorize?provider=${provider}`;
  }

  confirm(token, remember) {
    if (typeof token === 'object' && token.remember) {
      remember = token.remember;
      token = token.token;
    }
    this._setRememberHeaders(remember);
    return this.verify("signup", token, remember);
  }

  requestPasswordRecovery(email) {
    return this._request("/recover", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  recover(token, remember) {
    if (typeof token === 'object' && token.remember) {
      remember = token.remember;
      token = token.token;
    }
    this._setRememberHeaders(remember);
    return this.verify("recovery", token, remember);
  }

  acceptInvite(token, password, remember) {
    if (typeof token === 'object' && token.password) {
      remember = token.remember;
      password = token.password;
      token = token.token;
    }
    this._setRememberHeaders(remember);
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, password, type: "signup" })
    }).then(response => this.createUser(response, remember));
  }

  acceptInviteExternalUrl(provider, token) {
    return `${
      this.api.apiURL
    }/authorize?provider=${provider}&invite_token=${token}`;
  }

  createUser(tokenResponse, remember = false) {
    this._setRememberHeaders(remember);
    const user = new User(this.api, tokenResponse, this.audience);
    return user.getUserData().then(user => {
      if (remember) {
        user._saveSession();
      }
      return user;
    });
  }

  currentUser() {
    const user = User.recoverSession(this.api);
    user && this._setRememberHeaders(user._fromStorage);
    return user;
  }

  verify(type, token, remember) {
    if (typeof type === 'object' && type.token) {
      remember = type.remember;
      token = type.token;
      type = type.token;
    }
    this._setRememberHeaders(remember);
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, type })
    }).then(response => this.createUser(response, remember));
  }

  _setRememberHeaders(remember) {
    if (this.setCookie) {
      this.api.defaultHeaders = this.api.defaultHeaders || {};
      this.api.defaultHeaders["X-Use-Cookie"] = remember ? "1" : "session";
    }
  }
}

if (typeof window !== "undefined") {
  window.GoTrue = GoTrue;
}
