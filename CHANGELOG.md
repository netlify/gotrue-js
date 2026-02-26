## [0.9.28](https://github.com/netlify/gotrue-js/compare/v0.9.27...v0.9.28) (2020-12-07)

### Bug Fixes

- **docs-readme:** add note about using admin methods with Netlify CLI ([#234](https://github.com/netlify/gotrue-js/issues/234)) ([5f3d504](https://github.com/netlify/gotrue-js/commit/5f3d504b3694610d56027bf40ef7fbf2f1f37eaa))

## [1.0.1](https://github.com/netlify/gotrue-js/compare/v1.0.0...v1.0.1) (2026-02-26)


### Bug Fixes

* declare stricter types for the user class ([#914](https://github.com/netlify/gotrue-js/issues/914)) ([5c24c7a](https://github.com/netlify/gotrue-js/commit/5c24c7a9d10e1051924f962304341d1abcca68a9))

## 1.0.0 (2026-02-26)


### ⚠ BREAKING CHANGES

* Adding the exports map restricts subpath imports. Consumers using deep imports (e.g., gotrue-js/lib/user) will need to update to use the root entry point instead.

### Features

* add ESM build and package exports map ([#911](https://github.com/netlify/gotrue-js/issues/911)) ([a5386aa](https://github.com/netlify/gotrue-js/commit/a5386aabbad3c92033e30ec38dd35c2068f90eb3))
* add validateCurrentSession() for server-side session validation ([#902](https://github.com/netlify/gotrue-js/issues/902)) ([e36ac9d](https://github.com/netlify/gotrue-js/commit/e36ac9ddaf10f5c5aa2a7bc01fa41cb76dc074a3))
* pass client header ([#910](https://github.com/netlify/gotrue-js/issues/910)) ([a30ede1](https://github.com/netlify/gotrue-js/commit/a30ede1d99f43cc6f5041a2559cede29dc31a1bb))


### Bug Fixes

* add changelog to prettier ignore ([#901](https://github.com/netlify/gotrue-js/issues/901)) ([0bcf5d7](https://github.com/netlify/gotrue-js/commit/0bcf5d7c0234bce62c1d90b86fe4be83f1f28593))
* add more tests and fix bugs ([#893](https://github.com/netlify/gotrue-js/issues/893)) ([795e2ac](https://github.com/netlify/gotrue-js/commit/795e2ac3f635c444f7e6e8772ed75eb07cda4360))
* cross-tab logout sync ([#900](https://github.com/netlify/gotrue-js/issues/900)) ([9d56ecd](https://github.com/netlify/gotrue-js/commit/9d56ecdb6613d213e658965541ea769a816ecd95))
* husky binary not found ([c8f42b9](https://github.com/netlify/gotrue-js/commit/c8f42b922c2c899abc55a603bb2c8eadd9af6db1))
* husky binary not found ([0fdf7e8](https://github.com/netlify/gotrue-js/commit/0fdf7e810e3a5a54d36cc830b219f41cee5748fd))
* skip prepare script during prerelease install ([#904](https://github.com/netlify/gotrue-js/issues/904)) ([bdade18](https://github.com/netlify/gotrue-js/commit/bdade182d2fd15a2072f581e16494da01643bda7))
* update eslint dependencies ([#894](https://github.com/netlify/gotrue-js/issues/894)) ([d783d08](https://github.com/netlify/gotrue-js/commit/d783d088bcf47601fdd718e136699633f462d778))
* update github actions and clean them ([#895](https://github.com/netlify/gotrue-js/issues/895)) ([50c9fb5](https://github.com/netlify/gotrue-js/commit/50c9fb549cc3c056f733c1b847868111a56264a5))
* update github workflows to node 20 ([77546c4](https://github.com/netlify/gotrue-js/commit/77546c4da06e886325916d5747839f048928bfc7))
* update github workflows to node 20 ([6ec338c](https://github.com/netlify/gotrue-js/commit/6ec338ca141676ce389404a8052cbcf19285e8e9))

### [0.9.29](https://www.github.com/netlify/gotrue-js/compare/v0.9.28...v0.9.29) (2021-01-28)

### Bug Fixes

- **security:** don't log token on parsing errors ([#279](https://www.github.com/netlify/gotrue-js/issues/279)) ([1334f52](https://www.github.com/netlify/gotrue-js/commit/1334f5289a53f226defdea99d694788cfae290b5))

## [0.9.27](https://github.com/netlify/gotrue-js/compare/v0.9.26...v0.9.27) (2020-09-07)

### Bug Fixes

- **types:** make signup data argument optional ([#165](https://github.com/netlify/gotrue-js/issues/165)) ([d1565a7](https://github.com/netlify/gotrue-js/commit/d1565a7d0576ff613b1c37c46a42d1fcbd720c7c))

## [0.9.26](https://github.com/netlify/gotrue-js/compare/v0.9.25...v0.9.26) (2020-06-30)

### Bug Fixes

- **docs:** format readme file and add some missing arguments ([#110](https://github.com/netlify/gotrue-js/issues/110)) ([738998e](https://github.com/netlify/gotrue-js/commit/738998eb212b7a4bb0b6dfb86a958fab7450b40d))
- return a rejected promise when inner token is null or undefined ([#83](https://github.com/netlify/gotrue-js/issues/83)) ([2ae4de5](https://github.com/netlify/gotrue-js/commit/2ae4de5317c0a9962ee027346fdf611aba4ae566))
