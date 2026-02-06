import { test, expect, vi, beforeEach } from 'vitest';

import API, { HTTPError, JSONHTTPError, TextHTTPError } from '../src/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

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

beforeEach(() => {
  vi.clearAllMocks();
});

// Constructor tests
test('should initialize with empty apiURL by default', () => {
  const api = new API();

  expect(api.apiURL).toBe('');
});

test('should initialize with provided apiURL', () => {
  const api = new API('https://example.com/api');

  expect(api.apiURL).toBe('https://example.com/api');
});

test('should initialize with default headers', () => {
  const api = new API('https://example.com', {
    defaultHeaders: { 'X-Custom': 'value' },
  });

  expect(api.defaultHeaders).toEqual({ 'X-Custom': 'value' });
});

test('should detect same-origin URLs starting with /', async () => {
  const api = new API('/api');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test');

  // Same-origin URLs should include credentials
  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      credentials: 'same-origin',
    }),
  );
});

test('should NOT treat absolute URLs as same-origin', async () => {
  const api = new API('https://example.com/api');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test');

  // Absolute URLs should NOT include credentials
  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs[1].credentials).toBeUndefined();
});

test('should NOT treat protocol-relative URLs as same-origin', async () => {
  const api = new API('//other-domain.com/api');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test');

  // Protocol-relative URLs are cross-origin
  const callArgs = mockFetch.mock.calls[0];
  expect(callArgs[1].credentials).toBeUndefined();
});

// Request tests
test('should make GET request with correct URL', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(createMockResponse({ body: { data: 'test' } }));

  await api.request('/users');

  expect(mockFetch).toHaveBeenCalledWith('https://example.com/users', expect.any(Object));
});

test('should include Content-Type header when body is present', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test', { body: JSON.stringify({ data: 'test' }) });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
      }),
    }),
  );
});

test('should not include Content-Type header for requests without body', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test');

  const [, options] = mockFetch.mock.calls[0];
  expect(options.headers['Content-Type']).toBeUndefined();
});

test('should merge default headers with request headers', async () => {
  const api = new API('https://example.com', {
    defaultHeaders: { 'X-Default': 'default-value' },
  });
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test', {
    headers: { 'X-Custom': 'custom-value' },
    body: JSON.stringify({ data: 'test' }),
  });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Default': 'default-value',
        'X-Custom': 'custom-value',
        'Content-Type': 'application/json',
      }),
    }),
  );
});

test('should allow overriding Content-Type header', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'key=value',
  });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/x-www-form-urlencoded',
      }),
    }),
  );
});

test('should pass method and body in request', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }),
  });

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    }),
  );
});

test('should return parsed JSON for JSON responses', async () => {
  const api = new API('https://example.com');
  const expectedData = { id: 1, name: 'Test' };
  mockFetch.mockResolvedValue(createMockResponse({ body: expectedData }));

  const result = await api.request<typeof expectedData>('/test');

  expect(result).toEqual(expectedData);
});

test('should return text for non-JSON responses', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(
    createMockResponse({
      contentType: 'text/plain',
      body: 'Hello World',
    }),
  );

  const result = await api.request<string>('/test');

  expect(result).toBe('Hello World');
});

test('should include credentials for same-origin requests', async () => {
  // Same-origin URL
  const api = new API('/api');
  mockFetch.mockResolvedValue(createMockResponse({ body: {} }));

  await api.request('/test');

  expect(mockFetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      credentials: 'same-origin',
    }),
  );
});

// Error handling tests
test('should throw JSONHTTPError for failed JSON responses', async () => {
  const api = new API('https://example.com');
  const errorBody = { error: 'Not found', message: 'User not found' };
  mockFetch.mockResolvedValue(
    createMockResponse({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      body: errorBody,
    }),
  );

  await expect(api.request('/test')).rejects.toThrow(JSONHTTPError);

  try {
    await api.request('/test');
  } catch (error) {
    expect(error).toBeInstanceOf(JSONHTTPError);
    expect((error as JSONHTTPError).status).toBe(404);
    expect((error as JSONHTTPError).json).toEqual(errorBody);
  }
});

test('should throw TextHTTPError for failed text responses', async () => {
  const api = new API('https://example.com');
  mockFetch.mockResolvedValue(
    createMockResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      contentType: 'text/plain',
      body: 'Something went wrong',
    }),
  );

  await expect(api.request('/test')).rejects.toThrow(TextHTTPError);

  try {
    await api.request('/test');
  } catch (error) {
    expect(error).toBeInstanceOf(TextHTTPError);
    expect((error as TextHTTPError).status).toBe(500);
    expect((error as TextHTTPError).data).toBe('Something went wrong');
  }
});

// Error class tests
test('HTTPError should have status and name', () => {
  const response = createMockResponse({ status: 401, statusText: 'Unauthorized' });
  const error = new HTTPError(response);

  expect(error.name).toBe('HTTPError');
  expect(error.status).toBe(401);
  expect(error.message).toBe('Unauthorized');
});

test('TextHTTPError should extend HTTPError with data', () => {
  const response = createMockResponse({ status: 400, statusText: 'Bad Request' });
  const error = new TextHTTPError(response, 'Invalid input');

  expect(error).toBeInstanceOf(HTTPError);
  expect(error.name).toBe('TextHTTPError');
  expect(error.data).toBe('Invalid input');
});

test('JSONHTTPError should extend HTTPError with json', () => {
  const response = createMockResponse({ status: 422, statusText: 'Unprocessable Entity' });
  const errorJson = { msg: 'Validation failed' };
  const error = new JSONHTTPError(response, errorJson);

  expect(error).toBeInstanceOf(HTTPError);
  expect(error.name).toBe('JSONHTTPError');
  expect(error.json).toEqual(errorJson);
});
