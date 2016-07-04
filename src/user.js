
const ExpiryMargin = 60 * 1000;

export default class User {
  constructor(api, tokenResponse) {
    this.api = api;
    this.processTokenResponse(tokenResponse);
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
    if (this.jwt_expiry - ExpiryMargin < new Date().getTime()) {
      return this.api.request('/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`
      }).then((response) => {
        this.processTokenResponse(response);
        return this.jwt_token;
      });
    }
    return Promise.resolve(this.jwt_token);
  }

  logout() {
    return this.request('/logout', {method: 'POST'});
  }

  request(path, options) {
    return this.jwt().then((token) => this.api.request(path, {
      headers: {Authorization: `Bearer ${token}`},
      ...options
    }));
  }

  reload() {
    return this.request('/user').then(this.process.bind(this));
  }

  process(attributes) {
    for (var key in attributes) {
      if (key in this.prototype) { continue; }
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
}
