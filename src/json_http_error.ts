import { HTTPError } from './http_error';

export interface APIErrorJson {
  msg?: string;
  error?: string;
  error_description?: string;
  [key: string]: unknown;
}

export class JSONHTTPError extends HTTPError {
  json: APIErrorJson;

  constructor(status: number, json: APIErrorJson) {
    super(status, JSON.stringify(json));
    this.json = json;
    this.name = 'JSONHTTPError';
  }
}
