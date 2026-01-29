import { JSONHTTPError } from './json_http_error';
import { TextHTTPError } from './text_http_error';

export { HTTPError } from './http_error';
export type { APIErrorJson } from './json_http_error';
export { JSONHTTPError } from './json_http_error';
export { TextHTTPError } from './text_http_error';

// 30 seconds default timeout
const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
  audience?: string;
  timeout?: number;
}

interface RequestContext {
  timeout: number;
  attempt: number;
}

function parseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function handleErrorResponse(status: number, text: string, isJSON: boolean): never {
  if (isJSON) {
    const json = parseJSON(text);
    if (json) {
      throw new JSONHTTPError(status, json as Record<string, unknown>);
    }
  }
  throw new TextHTTPError(status, text);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getBackoffDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s
  return 1000 * 2 ** attempt;
}

function shouldRetry(status: number, attempt: number): boolean {
  return attempt < MAX_RETRIES && RETRY_STATUS_CODES.has(status);
}

function processResponse<T>(text: string, isJSON: boolean): T {
  if (isJSON) {
    return parseJSON<T>(text) ?? (text as unknown as T);
  }
  return text as unknown as T;
}

async function handleResponse<T>(response: Response, attempt: number): Promise<T> {
  const contentType = response.headers.get('content-type');
  const isJSON = contentType?.toLowerCase().includes('application/json') ?? false;
  const text = await response.text();

  if (!response.ok) {
    if (shouldRetry(response.status, attempt)) {
      throw new TextHTTPError(response.status, text);
    }
    handleErrorResponse(response.status, text, isJSON);
  }

  return processResponse<T>(text, isJSON);
}

export default class API {
  apiURL: string;
  defaultHeaders: Record<string, string>;

  constructor(apiURL: string, options: { defaultHeaders?: Record<string, string> } = {}) {
    this.apiURL = apiURL;
    this.defaultHeaders = options.defaultHeaders || {};
  }

  request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    const context: RequestContext = {
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      attempt: 0,
    };

    return this.executeWithRetry<T>(path, headers, options, context);
  }

  private async executeWithRetry<T>(
    path: string,
    headers: Record<string, string>,
    options: RequestOptions,
    context: RequestContext,
  ): Promise<T> {
    let lastError: Error = new Error('Request failed');

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      context.attempt = attempt;
      try {
        return await this.executeRequest<T>(path, headers, options, context);
      } catch (error) {
        lastError = error as Error;
        const status = error instanceof TextHTTPError ? error.status : 0;
        if (!shouldRetry(status, attempt)) {
          throw error;
        }
        await delay(getBackoffDelay(attempt));
      }
    }

    throw lastError;
  }

  private async executeRequest<T>(
    path: string,
    headers: Record<string, string>,
    options: RequestOptions,
    context: RequestContext,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), context.timeout);

    try {
      const response = await fetch(`${this.apiURL}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body,
        credentials: options.credentials || 'same-origin',
        signal: controller.signal,
      });

      return await handleResponse<T>(response, context.attempt);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new TextHTTPError(408, 'Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
