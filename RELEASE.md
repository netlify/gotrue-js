# Releasing

## Production Release

Merge the release PR created by release-please. This automatically publishes to npm with the `latest` tag.

## Pre-releases

To publish a pre-release version (beta, alpha, next, etc.):

1. Create a branch with the pattern `releases/<tag>/<version>`
2. Push to that branch

| Branch | Published version | npm tag |
|--------|-------------------|---------|
| `releases/beta/1.2.3` | `1.2.3-beta.1` | `beta` |
| `releases/alpha/2.0.0` | `2.0.0-alpha.1` | `alpha` |
| `releases/next/1.5.0` | `1.5.0-next.1` | `next` |

Each push to the same branch increments the build number (`.1`, `.2`, `.3`, etc.), so you can iterate without creating new branches.

### Example workflow

```bash
# Create and push a beta branch
git checkout -b releases/beta/1.0.0
git push -u origin releases/beta/1.0.0
# -> publishes 1.0.0-beta.1

# Make changes and push again
git add .
git commit -m "fix: something"
git push
# -> publishes 1.0.0-beta.2
```

### Installing pre-releases

```bash
npm install gotrue-js@beta          # latest beta
npm install gotrue-js@1.0.0-beta.2  # specific version
```
