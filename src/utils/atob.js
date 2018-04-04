const isomorphicBase64 = require('isomorphic-base64');

let atob;
if (typeof window !== "undefined" && typeof window.atob === "function") {
  atob = window.atob;
}
else {
  atob = isomorphicBase64.atob;
}

export default atob;
