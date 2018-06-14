# gotrue-js library

[![Build Status](https://travis-ci.org/netlify/gotrue-js.svg?branch=master)](https://travis-ci.org/netlify/gotrue-js)

This is a JavaScript client library for the [GoTrue](https://github.com/netlify/gotrue) API.

It lets you create and authenticate users and is a building block for constructing
the UI for signups, password recovery, login and logout.

Play around the methods via the [demo site](https://lunaceee-gotruejs.netlify.com/).

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
  audience: "",
  setCookie: false
});
```

### GoTrue configuration

APIUrl: The absolute path of the GoTrue endpoint. To find the `APIUrl`, go to `Identity` page of your Netlify site dashboard.

audience(optional): `audience` is one of the pre-defined [JWT payload](https://tools.ietf.org/html/rfc7519#section-4.1.3) claims. It's an optional attribute which is set to be empty by default. If you were hosting your own identity service and wanted to support [multitenancy](https://en.wikipedia.org/wiki/Multitenancy), you would need `audience` to separate the users.

setCookie(optional): set to be `false` by default. If you wish to implement the `remember me` functionality, set the value to be `true`.

### Error handling

If an error occurs during the request, the promise may be rejected with an Error, `HTTPError`, `TextHTTPError`, or `JSONHTTPError`. See [micro-api-client-lib error types](https://github.com/netlify/micro-api-client-lib#class-httperror-extends-error).

## Authentication examples

### Create a new user

Create a new user with the specified email and password

```js
auth.signup(email, password);
```

Example usage:

```js
auth
  .signup(email, password)
  .then(response => console.log("Confirmation email sent", response))
  .catch(error => console.log("It's an error", error));
```

Example response object:

```js
{
  id: 'example-id',
  aud: '',
  role: '',
  email: 'example@example.com',
  confirmation_sent_at: '2018-04-27T22:36:59.636416916Z',
  app_metadata: { provider: 'email' },
  user_metadata: null,
  created_at: '2018-04-27T22:36:59.632133283Z',
  updated_at: '2018-04-27T22:37:00.061039863Z'
}
```

Also, make sure the `Registration preferences` under `Identity settings` in your Netlify dashboard are set to `Open`.

![registration preferences](src/images/identity-settings-registration.png)

If the registration preferences is set to be `Invite only`, you'll get an error message like this:
`{code: 403, msg: 'Signups not allowed for this instance'}`

### Confirm a new user signup

This function confirms a user sign up via a unique confirmation token

```js
auth.confirm(token);
```

When a new user signed up, a confirmation email will be sent to the user if `Autoconfirm` isn't turned on under the [identity settings](https://www.netlify.com/docs/identity/#adding-users).

In the email, there's a link that says "Confirm your email address".
When a user clicks on the link, it'll be redirected to the site with a [fragment identifier](https://en.wikipedia.org/wiki/Fragment_identifier) `#confirmation_token=Iyo9xHvsGVbW-9A9v4sDmQ` in the URL.

For all good reasons, the `confirmation_token` is hidden from the browser via a redirect.

If you wish to manually confirm a user using the `auth.confirm(token)` method,
you can copy the link location of the email and use the `curl -I` script to get the `confirmation_token` from your terminal. E.g.,

```
$ curl -I https://mandrillapp.com/track/click/30002868/example.netlify.com?p=example-token
  HTTP/1.1 302 Moved Temporarily
  Server: nginx/1.12.2
  Date: Tue, 15 May 2018 21:19:13 GMT
  Content-Type: text/html; charset=utf-8
  Set-Cookie: PHPSESSID=77c421bf85fa412e5f994f28a6b30956; expires=Wed, 16-May-2018 07:19:13 GMT; path=/; secure; HttpOnly
  Expires: Thu, 19 Nov 1981 08:52:00 GMT
  Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0
  Pragma: no-cache
  Set-Cookie: PHPSESSID=77c421bf85fa412e5f994f28a6b30956; expires=Wed, 16-May-2018 07:19:13 GMT; path=/; secure; httponly
  Location: https://example.netlify.com/#confirmation_token=Iyo9xHvsGVbW-9A9v4sDmQ
```

Example usage:

```js
auth
  .confirm(token)
  .then(function(response) {
    console.log("Confirmation email sent", JSON.stringify({ response }));
  })
  .catch(function(e) {
    console.log(e);
  });
```

_This method requires usage of browser window object `localStorage`. Test the usage in your front end code._

Example response object:

```js
{
  "response": {
    "api": {
      "apiURL": "https://example.netlify.com/.netlify/identity",
      "_sameOrigin": true,
      "defaultHeaders": {}
    },
    "url": "https://example.netlify.com/.netlify/identity",
    "token": {
      "access_token": "example-jwt-token",
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "example-refresh_token",
      "expires_at": 1526110512000
    },
    "id": "example-id",
    "aud": "",
    "role": "",
    "email": "example@netlify.com",
    "confirmed_at": "2018-05-12T06:35:13Z",
    "confirmation_sent_at": "2018-05-12T06:34:35Z",
    "app_metadata": {
      "provider": "email"
    },
    "user_metadata": {},
    "created_at": "2018-05-12T06:34:35Z",
    "updated_at": "2018-05-12T06:34:35Z"
  }
}
```

### Login a user

Handles user login via the specified email and password

`auth.login(email, password)`

Example usage:

```js
auth
  .login(email.value, password.value)
  .then(response => {
    showMessage("Success! Response: " + JSON.stringify({ response }), form);
  })
  .catch(error => showMessage("Failed :( " + JSON.stringify(error), form));
```

Example response object:

```js
{
  "response": {
    "api": {
      "apiURL": "https://example.netlify.com/.netlify/identity",
      "_sameOrigin": true,
      "defaultHeaders": {}
    },
    "url": "https://example.netlify.com/.netlify/identity",
    "token": {
      "access_token": "example-jwt-token",
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "example-refresh_token",
      "expires_at": 1526062471000
    },
    "id": "example-id",
    "aud": "",
    "role": "",
    "email": "example@netlify.com",
    "confirmed_at": "2018-05-04T23:57:17Z",
    "app_metadata": {
      "provider": "email"
    },
    "user_metadata": {},
    "created_at": "2018-05-04T23:57:17Z",
    "updated_at": "2018-05-04T23:57:17Z"
  }
}
```

### Request password recover email

This function sends a request to GoTrue API and triggers a password recovery email to the specified email address.
Similar to `confirmation_token`, the `recovery_token` is baked in the link of the email. You can also copy the link location from the email and run `curl -I` in the command line to grab the token.

`auth.requestPasswordRecovery(email)`

Example usage:

```js
auth
  .requestPasswordRecovery(email)
  .then(response => console.log("Recovery email sent", { response }))
  .catch(error => console.log("Error sending recovery mail: %o", error));
```

Example response object:
`{}`

### Recover a user account

This function recovers a user account via a recovery token

`auth.recover(recoveryToken)`

Example usage:

```js
auth
  .recover(token)
  .then(response =>
    console.log("Logged in as %s", JSON.stringify({ response }))
  )
  .catch(error => console.log("Failed to verify recover token: %o", error));
```

Example response object:

```js
{
  "response": {
    "api": {
      "apiURL": "https://example.netlify.com/.netlify/identity",
      "_sameOrigin": true,
      "defaultHeaders": {}
    },
    "url": "https://example.netlify.com/.netlify/identity",
    "token": {
      "access_token": "example-jwt-token",
      "token_type": "bearer",
      "expires_in": 3600,
      "refresh_token": "example-refresh_token",
      "expires_at": 1526107729000
    },
    "id": "example-id",
    "aud": "",
    "role": "",
    "email": "example@netlify.com",
    "confirmed_at": "2018-05-12T05:48:49Z",
    "invited_at": "2018-05-04T23:40:00Z",
    "recovery_sent_at": "2018-05-12T05:48:13Z",
    "app_metadata": {
      "provider": "email"
    },
    "user_metadata": {},
    "created_at": "2018-05-04T23:40:00Z",
    "updated_at": "2018-05-04T23:40:00Z"
  }
}
```

### Get current user

This function returns the current user object when a user is logged in

`auth.currentUser()`

Example usage:

```js
const user = auth.currentUser();
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
    "access_token": "example-jwt-token",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "example-refresh_token",
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

This function updates a user object with specified attributes

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
    "access_token": "example-jwt-token",
    "token_type": "bearer",
    "expires_in": 3600,
    "refresh_token": "example-refresh_token",
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

This function retrieves a JWT token from a currently logged in user

`user.jwt()`

Example usage:

```js
const user = auth.currentUser();
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
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MjUyMTk4MTYsInN1YiI6ImE5NG.98YDkB6B9JbBlDlqqef2nme2tkAnsi30QVys9aevdCw debugger eval code:1:43
```

### Logout a user

This function removes the current session of the user and log out the user

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

The following admin methods are currently not available to be used directly. You can access `context.clientContext.identity` and get a short lived admin token through a Lambda function and achieve the same goals, e.g., update user role, create or delete user etc. See [Identity and Functions](https://www.netlify.com/docs/functions/#identity-and-functions) for more info.

Let's create a simple login form in HTML and JavaScript to interact with a lambda function and test out the admin methods.

1. Create an HTML form for user login

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

2. Invoke lambda function. (In this example our function is names as `hello.js`)

```js
document.querySelector("form[name='login']").addEventListener("submit", e => {
  e.preventDefault();
  const form = e.target;
  const { email, password } = form.elements;
  auth
    .login(email.value, password.value)
    .then(response => {
      const myAuthHeader = "Bearer " + response.token.access_token; //creates the bearer token
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

This function retrieves a user object with the specified user id

```js
getUser(user) {
    return this.user.\_request(`/admin/users/${user.id}`);
}
```

Example usage:

```js
import fetch from "node-fetch";

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext;
  const userID = user.sub;
  const userUrl = `${identity.url}/admin/users/{${userID}}`;
  const adminAuthHeader = "Bearer " + identity.token;

  try {
    return fetch(userUrl, {
      method: "GET",
      headers: { Authorization: adminAuthHeader }
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("data", JSON.stringify(data));
        return { statusCode: 204 };
      })
      .catch(e => {
        console.log("Failed to get user! 500! Internal.");
        return {
          statusCode: 500,
          body: "Internal Server Error: " + e
        };
      });
  } catch (e) {
    console.log("GOT HERE! 500! outer");
    return { statusCode: 500, body: "Internal Server Error: " + e };
  }
};
```

Example response object:

```js
{
  "id": "example-id",
  "aud": "",
  "role": "",
  "email": "example@netlify.com",
  "confirmed_at": "2018-05-09T06:28:46Z",
  "app_metadata": {
    "provider": "email"
  },
  "user_metadata": {},
  "created_at": "2018-05-09T06:28:46Z",
  "updated_at": "2018-05-09T06:28:46Z"
}
```

### Update a user

This function updates the an existing user with the specified attributes

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
    return fetch(userUrl, {
      method: "PUT",
      headers: { Authorization: adminAuthHeader },
      body: JSON.stringify({ app_metadata: { roles: ["superstar"] } })
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("Updated a user! 204!");
        console.log(JSON.stringify({ data }));
        return { statusCode: 204 };
      })
      .catch(e => return {...});
  } catch (e) { return e; }
};
```

Example response object:

```js
{
  "data": {
    "id": "example-id",
    "aud": "",
    "role": "",
    "email": "example@netlify.com",
    "confirmed_at": "2018-05-09T06:52:58Z",
    "app_metadata": {
      "provider": "email",
      "roles": [
        "superstar"
      ]
    },
    "user_metadata": {},
    "created_at": "2018-05-09T06:52:58Z",
    "updated_at": "2018-05-11T00:26:27.668465915Z"
  }
}
```

### Invite a user

To invite a user using the admin token, do a `POST` request to `/invite` endpoint.

Example usage:

```js
import fetch from 'node-fetch';

exports.handler = async (event, context) => {
  const { identity } = context.clientContext;
  const inviteUrl = `${identity.url}/invite`;
  const adminAuthHeader = "Bearer " + identity.token;

    try {
      return fetch(inviteUrl, {
        method: "POST",
        headers: { Authorization: adminAuthHeader },
        body: JSON.stringify({ email: "example@example.com" })
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("Invited a user! 204!");
        console.log(JSON.stringify({ data }));
        return { statusCode: 204 };
      })
      .catch(e => return {...});
  } catch (e) { return e; };
};
```

Example response:

```js
{
  "id": "example-id",
  "aud": "",
  "role": "",
  "email": "example@example.com",
  "invited_at": "2018-05-25T20:28:04.436230023Z",
  "app_metadata": {
    "roles": [
    "admin",
    "test",
    "second-test-role",
    "third"
    ]
  },
  "user_metadata": null,
  "created_at": "2018-05-25T20:28:03.684905861Z",
  "updated_at": "2018-05-25T20:28:04.862592451Z"
}
```

### Create a new user

This function creates a new user object with the specified new email and password and other optional attributes.

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
  const userID = user.sub;
  const usersUrl = `${identity.url}/admin/users`;
  const adminAuthHeader = "Bearer " + identity.token;

  try {
    return fetch(usersUrl, {
      method: "POST",
      headers: { Authorization: adminAuthHeader },
      body: JSON.stringify({ email: "new-email@netlify.com", password: "newpw" })
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("Created a user! 204!");
        console.log(JSON.stringify({ data }));
        return { statusCode: 204 };
      })
      .catch(e => {...};
      });
  } catch (e) {
    return e;
  }
};
```

Example response object:

```js
{
  "data": {
    "id": "new-id",
    "aud": "",
    "role": "",
    "email": "new-email@netlify.com",
    "app_metadata": {
      "provider": "email"
    },
    "user_metadata": null,
    "created_at": "2018-05-11T00:37:34.475713996Z",
    "updated_at": "2018-05-11T00:37:34.481743781Z"
  }
}
```

### Delete a user

This function deletes an existing user object

```js
deleteUser(user) {
  return this.user.\_request(`/admin/users/${user.id}`, {
  method: "DELETE"
  });
}
```

Example usage:

```js
import fetch from "node-fetch";

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext;
  const userID = user.sub;
  const userUrl = `${identity.url}/admin/users/{${userID}}`;
  const adminAuthHeader = "Bearer " + identity.token;

  try {
    return fetch(userUrl, {
      method: "DELETE",
      headers: { Authorization: adminAuthHeader }
    })
      .then(response => {
        console.log("Deleted a user!");
        return response.json();
      })
      .then(data => {
        console.log({ data });
        return { statusCode: 204 };
      })
      .catch(e => {
        return {
          statusCode: 500,
          body: "Internal Server Error: " + e
        };
      });
  } catch (e) {
    return e;
  }
};
```

Example response object:

```
{ data: {} }
```

### Get a list of users

This function retrieves an array of user objects. The `audience` param is optional. It's for when you are hosting your own identity service and want to support [multitenancy](https://en.wikipedia.org/wiki/Multitenancy).

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
import fetch from "node-fetch";

exports.handler = async (event, context) => {
  const { identity, user } = context.clientContext;
  const usersUrl = `${identity.url}/admin/users`;
  const adminAuthHeader = "Bearer " + identity.token;

  try {
    return fetch(usersUrl, {
      method: "GET",
      headers: { Authorization: adminAuthHeader }
    })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log("data", JSON.stringify(data));
        return { statusCode: 204 };
      })
      .catch(e => {
        return {
          statusCode: 500,
          body: "Internal Server Error: " + e
        };
      });
  } catch (e) {
    return e;
  }
};
```

Example response object:

```js
{
  "aud": "",
  "users": [
    {
      "id": "example-id-01",
      "aud": "",
      "role": "",
      "email": "example-email-01@netlify.com",
      "app_metadata": {
        "provider": "email"
      },
      "user_metadata": {},
      "created_at": "2018-05-09T18:14:51Z",
      "updated_at": "2018-05-09T18:14:51Z"
    },
    {
      "id": "example-id-02",
      "aud": "",
      "role": "",
      "email": "example-email-02@netlify.com",
      "confirmed_at": "2018-05-09T06:52:58Z",
      "app_metadata": {
        "provider": "email"
      },
      "user_metadata": {},
      "created_at": "2018-05-09T06:52:58Z",
      "updated_at": "2018-05-09T06:52:58Z"
    },
    {
      "id": "example-id-03",
      "aud": "",
      "role": "",
      "email": "example-email-03@netlify.com",
      "confirmed_at": "2018-05-09T06:28:46Z",
      "app_metadata": {
        "provider": "email",
        "roles": [
          "admin"
        ]
      },
      "user_metadata": {},
      "created_at": "2018-05-09T06:28:46Z",
      "updated_at": "2018-05-09T06:28:46Z"
    }
  ]
}
```

## See also

* [gotrue]()
* [netlify-identity-widget]()
* [micro-api-client-library]()
* [Netlify identity docs]()
