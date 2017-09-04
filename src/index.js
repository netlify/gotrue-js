import API from "micro-api-client";
import User from "./user";

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `https://${window.location.hostname}/.netlify/identity`;

export default class GoTrue {
  constructor({ APIUrl = defaultApiURL, audience = "" } = {}) {
    if (APIUrl.match(HTTPRegexp)) {
      console.warn(
        "Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."
      );
    }

    if (audience) {
      this.audience = audience;
    }

    this.api = new API(APIUrl);
  }

  _request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }
    return this.api.request(path, options);
  }

  settings() {
    return this._request("/settings");
  }

  signup(email, password, data) {
    return this._request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data })
    });
  }

  login(email, password, remember) {
    return this._request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=password&username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`
    })
      .then(response => {
        User.removeSavedSession();
        return this.createUser(response, remember);
      });
  }

  loginExternalUrl(provider) {
    return this.api.apiURL + "/authorize?provider=" + provider;
  }

  confirm(token) {
    return this.verify("signup", token);
  }

  requestPasswordRecovery(email) {
    return this._request("/recover", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  recover(token) {
    return this.verify("recovery", token);
  }

  acceptInvite(token, password) {
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, password, type: "signup" })
    }).then(response => this.createUser(response));
  }

  createUser(tokenResponse, remember = false) {
    const user = new User(this.api, tokenResponse, this.audience);
    return user.getUserData()
      .then(user => {
        if (remember) {
          user._saveSession();
        }
        return user;
      });
  }

  currentUser() {
    return User.recoverSession();
  }

  verify(type, token) {
    return this._request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, type })
    }).then(response => this.createUser(response));
  }
}

if (typeof window !== "undefined") {
  window.GoTrue = GoTrue;
}
