import { test, expect, vi, beforeEach, afterEach } from 'vitest';

import API, { JSONHTTPError, TextHTTPError, HTTPError } from '../src/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to create a mock response
function mockResponse(body, options = {}) {
  const { status = 200, contentType = 'application/json' } = options;
  const bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) => (name.toLowerCase() === 'content-type' ? contentType : null),
    },
    text: () => Promise.resolve(bodyText),
  };
}

test('should parse successful JSON response', async () => {
  const api = new API('https://api.example.com');
  const responseData = { id: 1, name: 'Test' };

  mockFetch.mockResolvedValueOnce(mockResponse(responseData));

  const result = await api.request('/test');

  expect(result).toEqual(responseData);
  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.com/test',
    expect.objectContaining({
      method: 'GET',
      credentials: 'same-origin',
    }),
  );
});

test('should return text for non-JSON response', async () => {
  const api = new API('https://api.example.com');
  const responseText = 'Hello, World!';

  mockFetch.mockResolvedValueOnce(mockResponse(responseText, { contentType: 'text/plain' }));

  const result = await api.request('/test');

  expect(result).toBe(responseText);
});

test('should throw JSONHTTPError for JSON error response', async () => {
  const api = new API('https://api.example.com');
  const errorBody = { error: 'not_found', error_description: 'Resource not found' };

  // 404 is not retryable, so only one mock needed
  mockFetch.mockResolvedValueOnce(mockResponse(errorBody, { status: 404 }));

  try {
    await api.request('/test');
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(JSONHTTPError);
    expect(error.status).toBe(404);
    expect(error.json.error).toBe('not_found');
  }
});

test('should throw TextHTTPError for non-JSON error response', async () => {
  const api = new API('https://api.example.com');
  const errorText = 'Not Found';

  // 404 is not retryable, so only one mock needed
  mockFetch.mockResolvedValueOnce(
    mockResponse(errorText, { status: 404, contentType: 'text/plain' }),
  );

  await expect(api.request('/test')).rejects.toThrow(TextHTTPError);
});

test('should handle malformed JSON gracefully', async () => {
  const api = new API('https://api.example.com');
  const malformedJSON = '{ invalid json }';

  mockFetch.mockResolvedValueOnce(mockResponse(malformedJSON, { contentType: 'application/json' }));

  // Should return the raw text when JSON parsing fails
  const result = await api.request('/test');
  expect(result).toBe(malformedJSON);
});

test('should handle malformed JSON in error response gracefully', async () => {
  const api = new API('https://api.example.com');
  const malformedJSON = '{ invalid json }';

  mockFetch.mockResolvedValueOnce(
    mockResponse(malformedJSON, { status: 400, contentType: 'application/json' }),
  );

  // Should fall back to TextHTTPError when JSON parsing fails
  await expect(api.request('/test')).rejects.toThrow(TextHTTPError);
});

test('should handle case-insensitive content-type', async () => {
  const api = new API('https://api.example.com');
  const responseData = { id: 1 };

  mockFetch.mockResolvedValueOnce(
    mockResponse(responseData, { contentType: 'APPLICATION/JSON; charset=utf-8' }),
  );

  const result = await api.request('/test');
  expect(result).toEqual(responseData);
});

test('should include custom headers', async () => {
  const api = new API('https://api.example.com');

  mockFetch.mockResolvedValueOnce(mockResponse({}));

  await api.request('/test', { headers: { Authorization: 'Bearer token' } });

  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.com/test',
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer token',
      }),
    }),
  );
});

test('should use default headers', async () => {
  const api = new API('https://api.example.com', {
    defaultHeaders: { 'X-Custom-Header': 'value' },
  });

  mockFetch.mockResolvedValueOnce(mockResponse({}));

  await api.request('/test');

  expect(mockFetch).toHaveBeenCalledWith(
    'https://api.example.com/test',
    expect.objectContaining({
      headers: expect.objectContaining({
        'X-Custom-Header': 'value',
      }),
    }),
  );
});

function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function setupAbortListener(signal, reject) {
  signal.addEventListener('abort', () => reject(createAbortError()));
}

function createHangingPromise(options) {
  return new Promise((resolve, reject) => {
    setupAbortListener(options.signal, reject);
  });
}

test('should timeout and throw error', async () => {
  const api = new API('https://api.example.com');

  // Mock fetch that never resolves, but respects abort signal
  // 408 is retryable, so this will be called multiple times
  mockFetch.mockImplementation((url, options) => createHangingPromise(options));

  try {
    // Use a very short timeout for testing
    await api.request('/test', { timeout: 50 });
    expect.fail('Should have thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(TextHTTPError);
    expect(error.status).toBe(408);
    expect(error.message).toContain('timeout');
  }
}, 30_000);

test('should retry on 500 errors', async () => {
  const api = new API('https://api.example.com');
  const successResponse = { success: true };

  // Fail twice, then succeed
  mockFetch
    .mockResolvedValueOnce(mockResponse('Server Error', { status: 500, contentType: 'text/plain' }))
    .mockResolvedValueOnce(mockResponse('Server Error', { status: 500, contentType: 'text/plain' }))
    .mockResolvedValueOnce(mockResponse(successResponse));

  const result = await api.request('/test');

  expect(result).toEqual(successResponse);
  expect(mockFetch).toHaveBeenCalledTimes(3);
}, 15_000);

test('should not retry on 400 errors', async () => {
  const api = new API('https://api.example.com');
  const errorBody = { error: 'bad_request' };

  mockFetch.mockResolvedValueOnce(mockResponse(errorBody, { status: 400 }));

  await expect(api.request('/test')).rejects.toThrow(JSONHTTPError);
  expect(mockFetch).toHaveBeenCalledTimes(1);
});

test('should give up after max retries', async () => {
  const api = new API('https://api.example.com');

  // Always return 503 - retryable error
  mockFetch.mockResolvedValue(
    mockResponse('Service Unavailable', { status: 503, contentType: 'text/plain' }),
  );

  await expect(api.request('/test')).rejects.toThrow(TextHTTPError);

  // Initial attempt (0) + 3 retries (1,2,3) = 4 total calls
  // The loop runs while attempt <= MAX_RETRIES (3), so attempt = 0,1,2,3
  expect(mockFetch).toHaveBeenCalledTimes(4);
}, 20_000);

test('HTTPError should have correct prototype chain', () => {
  const error = new HTTPError(500, 'Test error');

  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(HTTPError);
  expect(error.status).toBe(500);
  expect(error.message).toBe('Test error');
});

test('JSONHTTPError should have correct prototype chain', () => {
  const json = { error: 'test' };
  const error = new JSONHTTPError(400, json);

  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(HTTPError);
  expect(error).toBeInstanceOf(JSONHTTPError);
  expect(error.status).toBe(400);
  expect(error.json).toEqual(json);
});

test('TextHTTPError should have correct prototype chain', () => {
  const error = new TextHTTPError(500, 'Server error');

  expect(error).toBeInstanceOf(Error);
  expect(error).toBeInstanceOf(HTTPError);
  expect(error).toBeInstanceOf(TextHTTPError);
  expect(error.status).toBe(500);
  expect(error.data).toBe('Server error');
});
