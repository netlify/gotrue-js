const ExpiryMargin = 60 * 1000;

export default class User {
  constructor(api, tokenResponse) {
    const now = new Date();
    this.api = api;
    this.processTokenResponse(tokenResponse);
  }

  update(attributes) {
    this.request('/user', {
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
    if (this.jwt_expiry + ExpiryMargin > new Date().getTime()) {
      return this.api.request('/token', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`
      }).then((response) => {
        this.processTokenResponse(response);
        return this.jwt;
      });
    }
    return Promise.resolve(this.jwt);
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
    this.request('/user').then((response) => {
      for (var key in response) {
        this[key] = response[key];
      }
      return this;
    });
  }

  processTokenResponse(tokenResponse) {
    this.refreshToken = tokenResponse.refresh_token;
    this.jwt = tokenResponse.access_token;
    this.jwt_expiry = now.setTime(now.getTime() + (tokenResponse.expires_in * 1000)).getTime();
  }
}
