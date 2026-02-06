export class HTTPError extends Error {
  status: number;

  constructor(response: Response) {
    super(response.statusText);
    this.name = 'HTTPError';
    this.status = response.status;
  }
}

export class TextHTTPError extends HTTPError {
  data: string;

  constructor(response: Response, data: string) {
    super(response);
    this.name = 'TextHTTPError';
    this.data = data;
  }
}

export class JSONHTTPError extends HTTPError {
  json: {
    msg?: string;
    error?: string;
    error_description?: string;
  };

  constructor(response: Response, json: Record<string, unknown>) {
    super(response);
    this.name = 'JSONHTTPError';
    this.json = json;
  }
}

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
  private _sameOrigin: boolean;

  constructor(apiURL?: string, options?: { defaultHeaders?: Record<string, string> }) {
    this.apiURL = apiURL || '';
    // Match relative URLs (start with / but not //) - these are same-origin
    this._sameOrigin = /^\/(?!\/)/.test(this.apiURL);
    this.defaultHeaders = options?.defaultHeaders || {};
  }

  private headers(headers: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.defaultHeaders,
      'Content-Type': 'application/json',
      ...headers,
    };
  }

  private static async parseJsonResponse<T>(response: Response): Promise<T> {
    const json = await response.json();
    if (!response.ok) {
      throw new JSONHTTPError(response, json);
    }
    return json;
  }

  async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
    const headers = this.headers(options.headers || {});
    // Only include Content-Type for requests with a body
    if (!options.body) {
      delete headers['Content-Type'];
    }
    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    if (this._sameOrigin) {
      fetchOptions.credentials = options.credentials || 'same-origin';
    }

    const response = await fetch(this.apiURL + path, fetchOptions);
    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('json')) {
      return API.parseJsonResponse<T>(response);
    }

    const data = await response.text();
    if (!response.ok) {
      throw new TextHTTPError(response, data);
    }

    return data as unknown as T;
  }
}
