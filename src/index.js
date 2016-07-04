import API from './api';
import User from './user';

const HTTPRegexp = /^http:\/\//;
const storageKey = "authlify.user";

export default class Authlify {
  constructor(options = {}) {
    if (!options.APIUrl) {
      throw("You must specify an APIUrl of your Authlify instance");
    }
    if (!options.APIUrl.match(HTTPRegexp)) {
      console.log('Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR AUTHLIFY EVER!\nAuthlify REQUIRES HTTPS to work securely.')
    }
    this.api = new API(options.APIUrl);
  }

  signup(email, password, data) {
    return this.api.request('/signup', {
      method: 'POST',
      body: JSON.stringify({email, password, data})
    });
  }

  login(email, password) {
    return this.api.request('/token', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `grant_type=password&username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    }).then((response) => new User(this.api, response).reload());
  }

  confirm(token) {
    return this.verify('signup', token);
  }

  requestPasswordRecovery(email) {
    return this.api.request('/recover', {
      method: 'POST',
      body: JSON.stringify({email})
    });
  }

  recover(token) {
    return this.verify('recovery', token);
  }

  persistSession(user) {
    if (user) {
      localStorage.setItem(storageKey, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKey);
    }

  }

  recoverSession() {
    const json = localStorage.getItem(storageKey);
    if (json) {
      const data = JSON.parse(json);
      return this.user(data.tokenResponse).process(data);
    }

    return null;
  }

  user(tokenResponse) {
    return new User(this.api, tokenResponse);
  }

  verify(type, token) {
    return this.api.request('/verify', {
      method: 'POST',
      body: JSON.stringify({token, type})
    }).then((response) => new User(this.api, response).reload());
  }
}

if (typeof window !== "undefined") {
  window.Authlify = Authlify
}
