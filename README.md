# gotrue-js

[![Build Status](https://travis-ci.org/netlify/gotrue-js.svg?branch=master)](https://travis-ci.org/netlify/gotrue-js)

This is a JS client library for the [GoTrue](https://github.com/netlify/gotrue) API.

It lets you signup and authenticate users and is a building block for constructing
the UI for signups, password recovery, login and logout.

## Installation

```
yarn add gotrue-js
```

## Usage

```js
import GoTrue from 'gotrue-js'  

const auth = new GoTrue();

auth.signup(email, password).then(
  response => console.log("Confirmation email sent"),
  error => console.log("Error during signup: %o", error.msg)
);

auth.confirm(token).then(
  user => console.log("Logged in as %s", user.email),
  error => console.log("Failed to log in: %o", error)
);

auth.login(email, password).then(
  user => console.log("Logged in as %s", user.email),
  error => console.log("Failed to log in: %o", error);
)

auth.requestPasswordRecovery(email).then(
  response => console.log("Recovery email sent"),
  error => console.log("Error sending recovery mail: %o", error)
);

auth.recover(token).then(
  user => console.log("Logged in as %s", user.email),
  error => console.log("Failed to verify recover token: %o", error)
);

const user = auth.currentUser()

// Users updating email requires an email confirmation step
user.update({email: newEmail, password: newPassword}).then(
  user => console.log("Updated user"),
  error => console.log("Failed to update user: %o", error)
);

user.jwt().then(
  token => console.log("Current token: %s", token),
  error => console.log("Failed to get token: %o", error)
);

user.logout().then(
  response => console.log("User logged out"),
  error => console.log("Failed to logout user: %o", error)
);

const admin = user.admin // User must have the 'admin' role

admin.list(audience).then(
  users => console.log("List of users: %o", users),
  error => console.log("Failed to get list of users: %o", error)
)

const user = { id: 1234 }
admin.getUser(user).then( 
  user => console.log("User object: %o", user),
  error => console.log("Failed to retrieve user: %o", error)
)

// Admins updating email does not require a confirmation step
const attributes = {email: newEmail, password: newPassword}
admin.updateUser(user, attributes).then(
  user => console.log("Updated user: %o", user),
  error => console.log("Failed to update user: %o", error)
)

admin.createUser(email, password, attributes = {}).then(
  user => console.log("Created user user: %o", user),
  error => console.log("Failed to create user: %o", error)
)

admin.deleteUser(user).then(
  user => console.log("Deleted user user: %o", user),
  error => console.log("Failed to delete user: %o", error)
)
```
