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
    const message = json.msg || json.error || JSON.stringify(json);
    super(status, message);
    this.json = json;
    this.name = 'JSONHTTPError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
