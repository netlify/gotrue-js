# GoTrue JS Client
[![Build Status](https://travis-ci.org/netlify/gotrue-js.svg?branch=master)](https://travis-ci.org/netlify/gotrue-js)

This is a JS library for [GoTrue](https://github.com/netlify/gotrue) API.

It lets you signup and authenticate users and is a building block for constructing
the UI for signups, password recovery, login and logout.

## Usage

```js
import GoTrue from 'gotrue-js'

const auth = new GoTrue();

auth.signup(email, password).then(
  (response) => console.log("Confirmation email sent"),
  (error) => console.log("Error during signup: %o", error.msg)
);

auth.confirm(token).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to log in: %o", error)
);

auth.login(email, password).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to log in: %o", error);
)

auth.requestPasswordRecovery(email).then(
  (response) => console.log("Recovery email sent"),
  (error) => console.log("Error sending recovery mail: %o", error)
);

auth.recover(token).then(
  (user) => console.log("Logged in as %s", user.email),
  (error) => console.log("Failed to verify recover token: %o", error)
);

const user = auth.currentUser()

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
