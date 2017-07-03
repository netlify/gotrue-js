import API from 'micro-api-client';

const ExpiryMargin = 60 * 1000;
const storageKey = "gotrue.user";
let currentUser = null;

export default class User {
  constructor(api, tokenResponse, audience) {
    this.api = api;
    this.processTokenResponse(tokenResponse);
    this.audience = audience;
  }

  static recoverSession() {
    if (currentUser) { return currentUser; }

    const json = localStorage.getItem(storageKey);
    if (json) {
      const data = JSON.parse(json);
      return new User(new API(data.api.apiURL), data.tokenResponse).process(data);
    }

    return null;
  }

  update(attributes) {
    return this.request('/user', {
      method: 'PUT',
      body: JSON.stringify(attributes)
    }).then((response) => {
      for (var key in response) {
        this[key] = response[key];
      }
      return this;
    });
  }

  jwt() {
    const {jwt_expiry, refreshToken, jwt_token} = this.tokenDetails();
    if (jwt_expiry - ExpiryMargin < new Date().getTime()) {
      return this.request('/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`
      }).then((response) => {
        this.processTokenResponse(response);
        this.refreshPersistedSession(this);
        return this.jwt_token;
      }).catch((error) => {
        console.error('failed to refresh token: %o', error);
        this.persistSession(null);
        this.jwt_expiry = this.refreshToken = this.jwt_token = null;
        return Promise.reject(error);
      });
    }
    return Promise.resolve(jwt_token);
  }

  logout() {
    return this.request('/logout', {method: 'POST'})
      .then(this.clearSession.bind(this))
      .catch(this.clearSession.bind(this));
  }

  request(path, options) {
    options = options || {};
    options.headers = options.headers || {};

    if (options.audience){
      options.headers['X-JWT-AUD'] = options.audience;
    } else if (this.audience){
      options.headers['X-JWT-AUD'] = this.audience;
    }

    return this.jwt().then((token) => this.api.request(path, {
      headers: Object.assign(options.headers, {Authorization: `Bearer ${token}`}),
      ...options
    }));
  }

  reload() {
    return this.request('/user')
      .then(this.process.bind(this))
      .then(this.refreshPersistedSession.bind(this));
  }

  process(attributes) {
    for (var key in attributes) {
      if (key in User.prototype || key == 'api') { continue; }
      this[key] = attributes[key];
    }
    return this;
  }

  processTokenResponse(tokenResponse) {
    const now = new Date();
    this.tokenResponse = tokenResponse;
    this.refreshToken = tokenResponse.refresh_token;
    this.jwt_token = tokenResponse.access_token;
    now.setTime(now.getTime() + (tokenResponse.expires_in * 1000));
    this.jwt_expiry = now.getTime();
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


  // Return a list of all users in an audience
  adminUsers(aud){
    return this.request('/admin/users', {
      method: 'GET',
      audience: aud
    })
  }

  // Create a user to be referenced in an admin request
  adminUser(email_or_id, aud){
    var u = {user: {}};
    if (typeof aud === 'undefined'){
      u.user._id = email_or_id;
    } else {
      u.user.email = email_or_id;
      u.user.aud = aud;
    }
    return u;
  }

  adminGetUser(user){
    return this.request('/admin/user', {
      method: 'GET',
      body: JSON.stringify(user)
    });
  }

  adminUpdateUser(user, attributes){
    attributes = attributes || {};
    attributes.user = user;
    return this.request('/admin/user', {
      method: 'PUT',
      body: JSON.stringify(attributes)
    });
  }

  adminCreateUser(email, password, attributes) {
    attributes = attributes || {};
    attributes.email = email;
    attributes.password = password;
    return this.request('/admin/user', {
      method: 'POST',
      body: JSON.stringify(attributes)
    });
  }

  adminDeleteUser(user) {
    return this.request('/admin/user/', {
        method: 'DELETE',
        body: JSON.stringify(user)
    });
  }


}
