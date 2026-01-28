import { JSONHTTPError } from './json_http_error';
import { TextHTTPError } from './text_http_error';

export { HTTPError } from './http_error';
export type { APIErrorJson } from './json_http_error';
export { JSONHTTPError } from './json_http_error';
export { TextHTTPError } from './text_http_error';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  credentials?: RequestCredentials;
  audience?: string;
}

export default class API {
  apiURL: string;
  defaultHeaders: Record<string, string>;

  constructor(apiURL: string, options: { defaultHeaders?: Record<string, string> } = {}) {
    this.apiURL = apiURL;
    this.defaultHeaders = options.defaultHeaders || {};
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...options.headers,
    };

    const response = await fetch(`${this.apiURL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body,
      credentials: options.credentials || 'same-origin',
    });

    const contentType = response.headers.get('content-type');
    const isJSON = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJSON) {
        const json = await response.json();
        throw new JSONHTTPError(response.status, json);
      }
      const text = await response.text();
      throw new TextHTTPError(response.status, text);
    }

    if (isJSON) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }
}
