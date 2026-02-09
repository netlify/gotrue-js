import { Buffer } from 'buffer';

import { test, expect, vi, beforeEach } from 'vitest';

import Admin from '../src/admin';
import API from '../src/api';
import type { Token } from '../src/user';
import User from '../src/user';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window and localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageMock.store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock.store[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

class MockTextDecoder {
  decode(bytes: Uint8Array): string {
    return String.fromCharCode(...bytes);
  }
}

global.window = {
  atob: (base64: string) => Buffer.from(base64, 'base64').toString('binary'),
  localStorage: localStorageMock,
  TextDecoder: MockTextDecoder,
  addEventListener: vi.fn(),
} as unknown as Window & typeof globalThis;

global.localStorage = localStorageMock as unknown as Storage;
global.TextDecoder = MockTextDecoder as unknown as typeof TextDecoder;

const createMockResponse = (options: {
  ok?: boolean;
  status?: number;
  statusText?: string;
  contentType?: string;
  body?: unknown;
}): Response => {
  const {
    ok = true,
    status = 200,
    statusText = 'OK',
    contentType = 'application/json',
    body = {},
  } = options;

  return {
    ok,
    status,
    statusText,
    headers: {
      get: (name: string) => (name === 'Content-Type' ? contentType : null),
    },
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
};

const createValidToken = (): Token => {
  const exp = Date.now() / 1000 + 3600;
  return {
    access_token: `header.${Buffer.from(JSON.stringify({ exp })).toString('base64')}.secret`,
    expires_at: exp * 1000,
    expires_in: 3600,
    refresh_token: 'refresh-token',
    token_type: 'bearer',
  };
};

const createMockUser = (): User => {
  // Use a real API instance so the URL is properly constructed
  const api = new API('https://example.com/.netlify/identity');
  const token = createValidToken();
  return new User(api, token, '');
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

test('Admin constructor should store user reference', () => {
  const user = createMockUser();
  const admin = new Admin(user);

  expect(admin).toBeDefined();
});

test('listUsers should GET /admin/users with audience', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  const usersResponse = {
    users: [
      { id: 'user-1', email: 'user1@example.com' },
      { id: 'user-2', email: 'user2@example.com' },
    ],
  };
  mockFetch.mockResolvedValue(createMockResponse({ body: usersResponse }));

  const result = await admin.listUsers('my-audience');

  expect(mockFetch).toHaveBeenCalledWith(
    'https://example.com/.netlify/identity/admin/users',
    expect.objectContaining({
      method: 'GET',
    }),
  );
  // Check that audience header was included
  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs[1].headers['X-JWT-AUD']).toBe('my-audience');
  expect(result).toEqual(usersResponse);
});

test('getUser should GET /admin/users/:id', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  const targetUser = { id: 'user-123', email: 'target@example.com' };
  mockFetch.mockResolvedValue(createMockResponse({ body: targetUser }));

  const result = await admin.getUser({ id: 'user-123' } as Parameters<typeof admin.getUser>[0]);

  expect(mockFetch).toHaveBeenCalledWith(
    'https://example.com/.netlify/identity/admin/users/user-123',
    expect.any(Object),
  );
  expect(result).toEqual(targetUser);
});

test('updateUser should PUT /admin/users/:id with attributes', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  const updatedUser = { id: 'user-123', email: 'updated@example.com', role: 'admin' };
  mockFetch.mockResolvedValue(createMockResponse({ body: updatedUser }));

  const result = await admin.updateUser(
    { id: 'user-123' } as Parameters<typeof admin.updateUser>[0],
    {
      email: 'updated@example.com',
    },
  );

  expect(mockFetch).toHaveBeenCalledWith(
    'https://example.com/.netlify/identity/admin/users/user-123',
    expect.objectContaining({
      method: 'PUT',
    }),
  );
  // Check body
  const callArgs = mockFetch.mock.calls[0];
  expect(JSON.parse(callArgs[1].body)).toEqual({ email: 'updated@example.com' });
  expect(result).toEqual(updatedUser);
});

test('updateUser should work with empty attributes', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  mockFetch.mockResolvedValue(createMockResponse({ body: { id: 'user-123' } }));

  await admin.updateUser({ id: 'user-123' } as Parameters<typeof admin.updateUser>[0]);

  const callArgs = mockFetch.mock.calls[0];
  expect(JSON.parse(callArgs[1].body)).toEqual({});
});

test('createUser should POST /admin/users with email and password', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  const newUser = { id: 'new-user', email: 'new@example.com' };
  mockFetch.mockResolvedValue(createMockResponse({ body: newUser }));

  const result = await admin.createUser('new@example.com', 'password123');

  expect(mockFetch).toHaveBeenCalledWith(
    'https://example.com/.netlify/identity/admin/users',
    expect.objectContaining({
      method: 'POST',
    }),
  );
  // Check body contains email and password
  const callArgs = mockFetch.mock.calls[0];
  const body = JSON.parse(callArgs[1].body);
  expect(body.email).toBe('new@example.com');
  expect(body.password).toBe('password123');
  expect(result).toEqual(newUser);
});

test('createUser should include additional attributes', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await admin.createUser('new@example.com', 'password123', {
    confirm: true,
    user_metadata: { name: 'New User' },
  });

  const callArgs = mockFetch.mock.calls[0];
  const body = JSON.parse(callArgs[1].body);
  expect(body).toEqual({
    confirm: true,
    user_metadata: { name: 'New User' },
    email: 'new@example.com',
    password: 'password123',
  });
});

test('deleteUser should DELETE /admin/users/:id', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await admin.deleteUser({ id: 'user-to-delete' } as Parameters<typeof admin.deleteUser>[0]);

  expect(mockFetch).toHaveBeenCalledWith(
    'https://example.com/.netlify/identity/admin/users/user-to-delete',
    expect.objectContaining({
      method: 'DELETE',
    }),
  );
});

test('admin methods should include Authorization header', async () => {
  const user = createMockUser();
  const admin = new Admin(user);
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await admin.listUsers('');

  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs[1].headers['Authorization']).toMatch(/^Bearer /);
});
