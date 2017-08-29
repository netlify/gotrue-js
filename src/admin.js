import queryString from 'query-string';

export default class Admin {
  constructor(user) {
    this.user = user;
  }

  // Return a list of all users in an audience
  listUsers(aud){
    return this.user.request('/admin/users', {
      method: 'GET',
      audience: aud
    })
  }

  getUser(user){
    return this.user.request('/admin/user?' + queryString.stringify(user));
  }

  updateUser(user, attributes = {}){
    attributes.user = user;
    return this.user.request('/admin/user', {
      method: 'PUT',
      body: JSON.stringify(attributes)
    });
  }

  createUser(email, password, attributes = {}) {
    attributes.email = email;
    attributes.password = password;
    return this.user.request('/admin/user', {
      method: 'POST',
      body: JSON.stringify(attributes)
    });
  }

  deleteUser(user) {
    return this.user.request('/admin/user/', {
      method: 'DELETE',
      body: JSON.stringify(user)
    });
  }
}
