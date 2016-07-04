# Authlify JS Client

This is a JS library for the [Authlify](https://github.com/netlify/authlify) API.

It lets you signup and authenticate users and is a building block for constructing
the UI for signups, password recovery, login and logout.

## Usage

```js
import Authlify from 'authlify-js'

const authlify = new Authlify({
  APIUrl: 'https://authlify.netlify.com'
});

authlify.signup(username, email).then(
  (response) => console.log("Confirmation email sent"),
  (error) => console.log("Error during signup: %o", error.msg)
);

authlify.confirm(token).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to log in: %o", error)
);

authlify.login(email, password).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to log in: %o", error);
)

authlify.requestPasswordRecovery(email).then(
  (response) => console.log("Recovery email sent"),
  (error) => console.log("Error sending recovery mail: %o", error)
);

authlify.recover(token).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to verify recover token: %o", error)
);

user.update({email: newEmail, password: newPassword}).then(
  (user) => console.log("Updated user"),
  (error) => console.log("Failed to update user: %o", error)
);

user.jwt().then(
  (token) => console.log("Current token: %s", token),
  (error) => console.log("Failed to get token: %o", error)
);

user.logout().then(
  (response) => console.log("User logged out"),
  (error) => console.log("Failed to logout user: %o", error)
);
```
