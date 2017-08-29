import API from "micro-api-client";
import User from "./user";

const HTTPRegexp = /^http:\/\//;
const defaultApiURL = `https://${window.location.hostname}/.netlify/identity`;

export default class GoTrue {
  constructor({ APIUrl = defaultApiURL, Audience = "" } = {}) {
    if (APIUrl.match(HTTPRegexp)) {
      console.warn(
        "Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."
      );
    }

    if (Audience) {
      this.audience = Audience;
    }

    this.api = new API(APIUrl);
  }

  request(path, options = {}) {
    options.headers = options.headers || {};
    const aud = options.audience || this.audience;
    if (aud) {
      options.headers["X-JWT-AUD"] = aud;
    }
    return this.api.request(path, options);
  }

  signup(email, password, data) {
    return this.request("/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, data })
    });
  }

  signupExternal(provider) {
    return this.request("/authorize?provider=" + provider);
  }

  login(email, password, remember) {
    return this.request("/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=password&username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`
    })
      .then(response => {
        const user = new User(this.api, response, this.audience);
        user.persistSession(null);
        return user.reload();
      })
      .then(user => {
        if (remember) {
          user.persistSession(user);
        }
        return user;
      });
  }

  loginExternal(provider) {
    return this.request("/authorize?provider=" + provider);
  }

  confirm(token) {
    return this.verify("signup", token);
  }

  requestPasswordRecovery(email) {
    return this.request("/recover", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  }

  recover(token) {
    return this.verify("recovery", token);
  }

  acceptInvite(token, password) {
    return this.request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, password, type: "signup" })
    }).then(response => new User(this.api, response).reload());
  }

  user(tokenResponse) {
    return new User(this.api, tokenResponse, this.audience);
  }

  currentUser() {
    return User.recoverSession();
  }

  verify(type, token) {
    return this.request("/verify", {
      method: "POST",
      body: JSON.stringify({ token, type })
    }).then(response => new User(this.api, response).reload());
  }
}

if (typeof window !== "undefined") {
  window.GoTrue = GoTrue;
}
