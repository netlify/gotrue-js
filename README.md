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

```
import GoTrue from "gotrue-js"

// Instantiate the GoTrue auth client with an optional configuration

auth = new GoTrue({
  APIUrl: 'https://<your domain name>/.netlify/identity',
  audience: "", // Set the X-JWT-AUD header
  setCookie: false
})
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

```
auth.signup(email, password)
```

Returns a promise that contains a response object. Check the inbox of the email address you used in this example, you should expect to see a confirmation email sent by Netlify.

Example usage:

```
auth.signup(email, password)
  .then(response => console.log("Confirmation email sent", response))
  .catch(error => console.log("It's an error",error));
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

```
{curl -I https://example.netlify.com?p=<example query>
...
Location: https://example.netlify.com/#confirmation_token=<example token>
}
```

Example usage:

`auth.confirm(token).then( response => console.log("Confirmation email sent", response), error => console.log("Error during signup: %o", error) );`

Note that you'll need to test out this method in the browser instead of using a REPL like `node` as it requires usage of `localStorage`. Otherwise, you'll get an error message that includes `Error during confirmation ReferenceError: localStorage is not defined`.

Example response object:

```
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

```
auth
  .login(email, password)
  .then(user => console.log("Logged in as %s", user, user.email))
  .catch(error => console.log("Failed to log in: %o", error))
```

Example response object:
`Logged in as [object Object] example@example.com`

### Send out password recover email

This function sends an email to the specified email address with a link the user can click to reset their password.

`auth.requestPasswordRecovery(email)`

Example usage:

```
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

```
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

```
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

```
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

```
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

```
const jwt = user.jwt();
jwt
  .then(response => console.log("This is a JWT token", response))
  .catch(error =>
    {
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

```
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

### Get a user

This function returns a user object with the given user id.
`admin.getUser(userObject)`

Example usage:

```
const user = { id: 1234 }
admin.getUser(user).then(
user => console.log("User object: %o", user),
error => console.log("Failed to retrieve user: %o", error)
)
```

Example response object:

### Update a user

This function updates the an user with the given attributes.

`admin.updateUser(userObject, attributes)`

Example usage:

Lambda Function example code:

```
import fetch from "node-fetch"; // Same as fetch = require("node-fetch").default;

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
.then(response => {
console.log("Updated a user role! 204!");
return { statusCode: 204 };
})
.catch(e => {
console.log("Failed to update a user role! 500! Internal.");
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

Front end example code

```
import GoTrue from "gotrue-js";

const auth = new GoTrue({
APIUrl: "https://example.netlify.com/.netlify/identity"
});

document.querySelector("form[name='login']").addEventListener("submit", e => {
e.preventDefault();
const form = e.target;
const { email, password } = form.elements;
auth
.login(email.value, password.value)
.then(response => {
const myAuthHeader = "Bearer " + response.token.access_token; //creates the bearer token
fetch("/.netlify/functions/lambda", {
headers: { Authorization: myAuthHeader },
credentials: "include"
})
.then(response => {
console.log({ response });
})
.catch(error => console.error("Error:", error));
})
.catch(error => showMessage("Failed :( " + JSON.stringify(error), form));
});
```

Example response object:

```
[
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
			"refresh_token": "c6oZhHPKyNQC3RbytoNjDg",
			"expires_at": 1525851876000
		},
		"id": "example-id",
		"aud": "",
		"role": "",
		"email": "example@example.com",
		"confirmed_at": "2018-05-04T23:57:17Z",
		"app_metadata": {
			"provider": "email",
			"roles": [
				"admin"
			]
		},
		"user_metadata": {},
		"created_at": "2018-05-04T23:57:17Z",
		"updated_at": "2018-05-04T23:57:17Z"
	},
	"Bearer <example-token>"
]
```

### Create a new user

This function creates a new user object with the new email and password and other optional attributes.

`admin.createUser(email, password, [attributes])`

Example usage:

```
admin.createUser(email, password, attributes = {}).then(
user => console.log("Created user user: %o", user),
error => console.log("Failed to create user: %o", error)
)
```

Example response object:

### Delete a user

This function deletes an existing user.
`admin.deleteUser(userObject)`

Example usage:

```
admin.deleteUser(user).then(
user => console.log("Deleted user user: %o", user),
error => console.log("Failed to delete user: %o", error)
)
```

Example response object:

### Get a list of users

This function returns a list of users under the particular site with the given audience.

`admin.list(audience)`

Example usage:

```
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
