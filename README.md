# gotrue-js

[![Build Status](https://travis-ci.org/netlify/gotrue-js.svg?branch=master)](https://travis-ci.org/netlify/gotrue-js)

This is a JS client library for the [GoTrue](https://github.com/netlify/gotrue) API.

It lets you signup and authenticate users and is a building block for constructing
the UI for signups, password recovery, login and logout.

Notice that any methods that require dealing with browser only features, such as `localStorage` or `window object` need to be tested in the browser instead of in the REPL.

## Installation

```
yarn add gotrue-js
```

## Usage

```js
import GoTrue from "gotrue-js";

// Instantiate the GoTrue auth client with an optional configuration

auth = new GoTrue({
  APIUrl: "https://<your domain name>/.netlify/identity",
  audience: "", // Set the X-JWT-AUD header
  setCookie: false
});
```

### GoTrue configuration

APIUrl: The absolute path of the GoTrue endpoint. To find the `APIUrl`, go to `Identity` page in your Netlify site dashboard.

audience(optional): `audience` is one of the pre-defined JWT payload claims. Claims are statements about an entity(typically, the user) and additional metadata. Leave it empty if there's no given value.

setCookie(optional): `false` by default. If you wish to use the `remember me` functionality, set the value to be `true`.

### Error handling

If an error occurs during the request, the promise may be rejected with an Error, `HTTPError`, `TextHTTPError`, or `JSONHTTPError`. See [micro-api-client-lib error types](https://github.com/netlify/micro-api-client-lib#class-httperror-extends-error).

## Authentication methods

### Create a new user

Create a new user with the provided email and password.

```js
auth.signup(email, password);
```

Returns a promise that contains a response object. Check the inbox of the email address you used in this example, you should expect to see a confirmation email sent by Netlify.

Example usage:

```js
auth
  .signup(email, password)
  .then(response => console.log("Confirmation email sent", response))
  .catch(error => console.log("It's an error", error));
```

Example response object:

```js
{ id: 'example-id',
  aud: '',
  role: '',
  email: 'example@example.com',
  confirmation_sent_at: '2018-04-27T22:36:59.636416916Z',
  app_metadata: { provider: 'email' },
  user_metadata: null,
  created_at: '2018-04-27T22:36:59.632133283Z',
  updated_at: '2018-04-27T22:37:00.061039863Z' }
```

Also, make sure the `Registration preferences` under `Identity settings` in your Netlify dashboard are set to `Open`.

[Screenshot]

If the registration preferences is set to be `Invite only`, you'll get an error message as follows:
`{code: 403, msg: 'Signups not allowed for this instance'}`

### Confirm a new user signup

Sends out an email to the user with a link to confirm their account.

`auth.confirm(token)`

A unique `confirmation_token` gets created when the user clicks on the link in the email.
For security reason, the token is hidden from the browser via redirect.

You can run `curl` to get the token in command line. E.g.,

```js
{curl -I https://example.netlify.com?p=<example query>
...
Location: https://example.netlify.com/#confirmation_token=<example token>
}
```

Example usage:

`auth.confirm(token).then( response => console.log("Confirmation email sent", response), error => console.log("Error during signup: %o", error) );`

Note that you'll need to test out this method in the browser instead of using a REPL like `node` as it requires usage of `localStorage`. Otherwise, you'll get an error message that includes `Error during confirmation ReferenceError: localStorage is not defined`.

Example response object:

```js
api: Object { apiURL: "https://example.netlify.com/.netlify/identity", \_sameOrigin: true, defaultHeaders: {} }
app_metadata: Object { provider: "email" }
aud: ""
audience: undefined
confirmation_sent_at: "2018-04-30T21:17:33Z"
confirmed_at: "2018-04-30T21:21:31Z"
created_at: "2018-04-30T21:01:38Z"
email: "example@example.com"
id: "example-id"
role: ""
token: Object { access_token: "example-token", token_type: "bearer", expires_in: 3600, … }
updated_at: "2018-04-30T21:01:38Z"
url: "https://example.netlify.com/.netlify/identity"
user_metadata: Object { }
```

### Login a user

Handles user login.

`auth.login(email, password)`

Example usage:

```js
auth
  .login(email, password)
  .then(user => console.log("Logged in as %s", user, user.email))
  .catch(error => console.log("Failed to log in: %o", error));
```

Example response object:
`Logged in as [object Object] example@example.com`

### Send out password recover email

This function sends an email to the specified email address with a link the user can click to reset their password.

`auth.requestPasswordRecovery(email)`

Example usage:

```js
auth
  .requestPasswordRecovery(email)
  .then(response => console.log("Recovery email sent"))
  .catch(error => console.log("Error sending recovery mail: %o", error));
```

Example response object:
`{}`

### Recover a user account

`auth.recover(recoveryToken)`

Example usage:

```js
auth
  .recover(token)
  .then(response => console.log("Logged in as %s", response))
  .catch(error => console.log("Failed to verify recover token: %o", error));
```

Example response object:
`[object Object]`

### Get current user

This function returns the current user object when a user is logged in.

`user = auth.currentUser()`

Example usage:
const user = auth.currentUser()

Example response object:

```js
{
  "api": {
    "apiURL": "https://example.netlify.com/.netlify/identity",
    "_sameOrigin": true,
    "defaultHeaders": {}
  },
  "url": "https://example.netlify.com/.netlify/identity",
  "token": {
    "access_token": "example-token",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "v4w7HfB4xfeKW9m8tg",
    "expires_at": 1525214326000
  },
  "id": "example-id",
  "aud": "",
  "role": "",
  "email": "example@example.com",
  "confirmed_at": "2018-05-01T19:21:00Z",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {},
  "created_at": "2018-05-01T19:21:00Z",
  "updated_at": "2018-05-01T19:21:00Z"
}
```

### Update a user

This function updates the user object with specified attributes.

`user.update( attributes )`

Example usage:

```js
const user = auth.currentUser();

user
  .update({ email: "example@example.com", password: "password" })
  .then(user => console.log("Updated user %s", user))
  .catch(error => {
    console.log("Failed to update user: %o", error);
    throw error;
  });
```

Example response object:

```js
{
  "api": {
    "apiURL": "https://example.netlify.com/.netlify/identity",
    "_sameOrigin": true,
    "defaultHeaders": {}
  },
  "url": "https://example.netlify.com/.netlify/identity",
  "token": {
    "access_token": "example-token",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "dSkuYfmkph-mxUVtOA5k_Q",
    "expires_at": 1525215471000
  },
  "id": "example-id",
  "aud": "",
  "role": "",
  "email": "example@example.com",
  "confirmed_at": "2018-05-01T19:21:00Z",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {},
  "created_at": "2018-05-01T19:21:00Z",
  "updated_at": "2018-05-01T22:04:07.923944421Z",
  "new_email": "new-example@example.com",
  "email_change_sent_at": "2018-05-01T22:04:07.49197052Z"
}
```

### Get a JWT token

This function returns the JWT token of a user object.

`user.jwd()`

Example usage:

```js
const jwt = user.jwt();
jwt
  .then(response => console.log("This is a JWT token", response))
  .catch(error => {
    console.log("Error fetching JWT token", error);
    throw error;
  });
```

Example response object:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MjUyMTk4MTYsInN1YiI6ImE5NGI0MzZhLTQxMzMtNGE4Mi05ZThlLTcxOTcxODJkODE2OSIsImVtYWlsIjoibHVuYSswMkBuZXRsaWZ5LmNvbSIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIn0sInVzZXJfbWV0YWRhdGEiOnt9fQ.98YDkB6B9JbBlDlqqef2nme2tkAnsi30QVys9aevdCw debugger eval code:1:43
```

### Logout a user

This function handles log out.

`user.logout()`

Example usage:

```js
const user = auth.currentUser();
user
  .logout()
  .then(response => console.log("User logged out");)
  .catch(error => {
    console.log("Failed to logout user: %o", error);
    throw error;
  });
```

## Admin methods

The following admin methods are currently not available to be used directly. You can access `context.clientContext.identity` and get a short lived admin token through a Lambda function and achieve the same goals as the admin methods, e.g., update user role, create or delete user etc. See [Identity and Functions](https://www.netlify.com/docs/functions/#identity-and-functions) for more info.

Let's create a simple form using HTML and JavaScript to interact with a lambda function to test out the admin calls.

1. Create an HTML form for user log in

```html
<h2>Log in</h2>
<form name="login">
  <div class="message"></div>
  <p>
    <label>Email<br/><input type="email" name="email" required/></label>
  </p>
  <p>
    <label>Password<br/><input type="password" name="password" required/></label>
  </p>
  <button type="submit">Log in</button>
</form>
```

2. Invoke lambda function in JavaScript. In this example we named our function `hello.js`.

```js
document.querySelector("form[name='login']").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const { email, password } = form.elements;
  auth
    .login(email.value, password.value)
    .then(response => {
      const myAuthHeader = "Bearer " + response.token.access_token; //creates the bearer token
      console.log({ myAuthHeader });
      fetch("/.netlify/functions/hello", {
        headers: { Authorization: myAuthHeader },
        credentials: "include"
      })
        .then(response => {
          console.log({ response });
        })
        .catch(error => {...});
    })
    .catch(error => {...});
});
```

### Get a user

This function returns a user object with the given user id.

```js
getUser(user) {
    return this.user.\_request(`/admin/users/${user.id}`);
}
```

Example usage:

```js
2:11:41 PM Got a user! 204!
2:11:41 PM { response:
Response {
size: 0,
timeout: 0,
[Symbol(Body internals)]: { body: [Object], disturbed: false, error: null },
[Symbol(Response internals)]:
{ url: 'https://example.com/.netlify/identity/admin/users/exampleuserid',
status: 200,
statusText: 'OK',
headers: [Object] } } }
```

Example response object:

### Update a user

This function updates the an existing user with the given attributes.

```js
updateUser(user, attributes = {}) {
   return this.user._request(`/admin/users/${user.id}`, {
     method: "PUT",
     body: JSON.stringify(attributes)
   });
}
```

Example usage:

```js
import fetch from "node-fetch";

exports.handler = async (event, context) => {
const { identity, user } = context.clientContext;
const userID = user.sub;
const userUrl = `${identity.url}/admin/users/${userID}`;
const adminAuthHeader = "Bearer " + identity.token;

try {
  fetch(userUrl, {
    method: "PUT",
    headers: { Authorization: adminAuthHeader },
    body: JSON.stringify({ app_metadata: { roles: ["admin"] } })
    })
    .then(response => {...})
    .catch(e => {...});
} catch (e) {...}
};
```

Example response object:

```js
[
  {
    api: {
      apiURL: "https://example.netlify.com/.netlify/identity",
      _sameOrigin: true,
      defaultHeaders: {}
    },
    url: "https://example.netlify.com/.netlify/identity",
    token: {
      access_token: "example-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "c6oZhHPKyNQC3RbytoNjDg",
      expires_at: 1525851876000
    },
    id: "example-id",
    aud: "",
    role: "",
    email: "example@example.com",
    confirmed_at: "2018-05-04T23:57:17Z",
    app_metadata: {
      provider: "email",
      roles: ["admin"]
    },
    user_metadata: {},
    created_at: "2018-05-04T23:57:17Z",
    updated_at: "2018-05-04T23:57:17Z"
  },
  "Bearer <example-token>"
];
```

### Create a new user

This function creates a new user object with the new email and password and other optional attributes.

```js
createUser(email, password, attributes = {}) {
    attributes.email = email;
    attributes.password = password;
    return this.user.\_request("/admin/users", {
    method: "POST",
    body: JSON.stringify(attributes)
    });
  }
```

Example usage:

```js
import fetch from "node-fetch";

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext;
  console.log({ identity, user });
  const userID = user.sub;
  const usersUrl = `${identity.url}/admin/users`;
  const adminAuthHeader = "Bearer " + identity.token;

  try {
  return fetch(usersUrl, {
  method: "POST",
  headers: { Authorization: adminAuthHeader },
  body: JSON.stringify({ email: "example@netlify.com", password: "gotrue" })
  })
  .then(response => {
  console.log("Created a user! 204!");
  console.log({ response });
  return { statusCode: 204 };
  })
  .catch(e => {...});
  } catch (e) {...}
};
```

Example response object:

```js
11:14:51 AM Created a user! 204!
11:14:51 AM { response:
Response {
size: 0,
timeout: 0,
[Symbol(Body internals)]: { body: [Object], disturbed: false, error: null },
[Symbol(Response internals)]:
{ url: 'https://example.netlify/identity/admin/users',
status: 200,
statusText: 'OK',
headers: [Object] } } }
```

### Delete a user

This function deletes an existing user object.

```js
deleteUser(user) {
return this.user.\_request(`/admin/users/${user.id}`, {
method: "DELETE"
});
}
```

Example usage:

```js
exports.handler = async (event, context) => {
const { identity, user } = context.clientContext;
console.log({ identity, user });
const userID = user.sub;
const userUrl = `${identity.url}/admin/users/{${userID}}`;
const adminAuthHeader = "Bearer " + identity.token;

try {
return fetch(userUrl, {
method: "DELETE",
headers: { Authorization: adminAuthHeader }
})
.then(response => {
console.log("Deleted a user! 204!");
console.log({ response });
return { statusCode: 204 };
})
.catch(e => {...});
} catch (e) {...}
};
```

Example response object:

```
11:58:01 AM Deleted a user! 204!
11:58:01 AM { response:
Response {
size: 0,
timeout: 0,
[Symbol(Body internals)]: { body: [Object], disturbed: false, error: null },
[Symbol(Response internals)]:
{ url: 'https://example.netlify.com/.netlify/identity/admin/users/exampleuserid',
status: 200,
statusText: 'OK',
headers: [Object] } } }
```

### Get a list of users

This function returns a list of users with the condition that the users are linked to the specified audience.

```js
listUsers(aud) {
    return this.user._request("/admin/users", {
      method: "GET",
      audience: aud
    });
}
```

Example usage:

```js
const admin = user.admin;
admin.listUsers(audience)
.then(
users => console.log("List of users: %o", users)).
error => console.log("Failed to get list of users: %o", error)
)
```

Example response object:

## See also

* [gotrue]()
* [netlify-identity-widget]()
* [micro-api-client-library]()
* [Netlify identity docs]()
