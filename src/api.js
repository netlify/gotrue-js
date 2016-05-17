export default class API {
  constructor(apiURL) {
    this.apiURL = apiURL;
  }

  headers(headers = {}) {
    return {
      'Content-Type': 'application/json',
      ...headers
    };
  }

  parseJsonResponse(response) {
    return response.json().then((json) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      return json;
    });
  }

  request(path, options = {}) {
    const headers = this.headers(options.headers || {});
    return fetch(this.apiURL + path, {...options, headers}).then((response) => {
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.match(/json/)) {
        return this.parseJsonResponse(response);
      }

      return response.text().then((text) => ({data: text}));
    });
  }
}
