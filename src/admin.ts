import type User from './user';

export interface UserData {
  id: string;
  aud: string;
  email: string;
  role: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  confirmed_at: string;
}

export interface UserAttributes {
  email?: string;
  password?: string;
  [key: string]: unknown;
}

export default class Admin {
  private user: User;

  constructor(user: User) {
    this.user = user;
  }

  // Return a list of all users in an audience
  listUsers(aud: string): Promise<UserData[]> {
    return this.user._request('/admin/users', {
      method: 'GET',
      audience: aud,
    });
  }

  getUser(user: UserData): Promise<UserData> {
    return this.user._request(`/admin/users/${encodeURIComponent(user.id)}`);
  }

  updateUser(user: UserData, attributes: UserAttributes = {}): Promise<UserData> {
    return this.user._request(`/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'PUT',
      body: JSON.stringify(attributes),
    });
  }

  createUser(email: string, password: string, attributes: UserAttributes = {}): Promise<UserData> {
    attributes.email = email;
    attributes.password = password;
    return this.user._request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(attributes),
    });
  }

  deleteUser(user: UserData): Promise<void> {
    return this.user._request(`/admin/users/${encodeURIComponent(user.id)}`, {
      method: 'DELETE',
    });
  }
}
