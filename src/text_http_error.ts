import { HTTPError } from './http_error';

export class TextHTTPError extends HTTPError {
  data: string;

  constructor(status: number, data: string) {
    super(status, data);
    this.data = data;
    this.name = 'TextHTTPError';
  }
}
