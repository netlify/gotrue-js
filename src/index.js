import API from './api';
import User from './user';

const HTTPRegexp = /^http:\/\//;

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

  signup(email, password) {
    return this.api.request('/signup', {
      method: 'POST',
      body: JSON.stringify({email, password})
    });
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

  verify(type, token) {
    return this.api.request('/verify', {
      method: 'POST',
      body: JSON.stringify({token, type})
    }).then((response) => {
      const user = new User(this.api, response);
      user.reload();
      return user;
    });
  }
}
