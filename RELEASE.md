# Release Checklist

Make sure you have npm + git credentials set up.

- [ ] Make changes and/or merge PRs.
- [ ] `git checkout master`
- [ ] `git pull`
- [ ] Set up semantic release environment variables:

```bash
export GIT_AUTHOR_NAME=<your-github-login>
export GIT_AUTHOR_EMAIL=<your-github-email>
export GIT_COMMITTER_NAME=<your-github-login>
export GIT_COMMITTER_EMAIL=<your-github-email>
export GITHUB_TOKEN=<github-token-with-public_repo-permissions>
```

- [ ] `npm run release`
