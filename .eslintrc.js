const { overrides } = require('@netlify/eslint-config-node');

module.exports = {
  extends: '@netlify/eslint-config-node',
  parserOptions: {
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  settings: {
    // Tell eslint-plugin-n to resolve TypeScript extensions
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
  rules: {
    // eslint-plugin-ava needs to know where test files are located
    'ava/no-ignored-test-files': [2, { files: ['tests/**/*.js'] }],

    // TODO: enable these rules
    'consistent-this': 0,
    'unicorn/no-this-assignment': 0,
    'func-style': 0,
    'no-throw-literal': 0,
    'no-param-reassign': 0,
    'no-magic-numbers': 0,
    'fp/no-mutation': 0,
    'fp/no-let': 0,
    'fp/no-class': 0,
    'fp/no-this': 0,
    'fp/no-loops': 0,
    'fp/no-delete': 0,
    'fp/no-mutating-assign': 0,
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: true }],
    'no-underscore-dangle': 0,
    complexity: 0,
    'max-depth': 0,
    'max-lines': 0,
    'promise/prefer-await-to-then': 0,
    'promise/no-return-wrap': 0,
    'promise/no-nesting': 0,
    camelcase: 0,
    'unicorn/prefer-prototype-methods': 0,

    // Disable node version checks - this is a browser library
    'node/no-unsupported-features/es-syntax': 0,
    'n/no-unsupported-features/es-syntax': 0,

    // Disable missing import for TypeScript (handled by TypeScript compiler)
    'n/no-missing-import': 0,
  },
  overrides: [
    ...overrides,
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
      ],
      settings: {
        'import/resolver': {
          typescript: {
            alwaysTryTypes: true,
            project: './tsconfig.json',
          },
        },
      },
      rules: {
        // Disable no-use-before-define for class self-references
        'no-use-before-define': 0,
        '@typescript-eslint/no-use-before-define': 0,
      },
    },
    {
      files: ['tests/**/*.js'],
      rules: {
        'node/no-unpublished-import': 0,
        'n/no-unpublished-import': 0,
        'n/no-missing-import': 0,
      },
    },
    {
      // TODO: remove this
      files: ['README.md'],
      rules: {
        'node/no-missing-import': 0,
        'n/no-missing-import': 0,
        'no-console': 0,
        'promise/always-return': 0,
        'require-await': 0,
        'node/exports-style': 0,
        'no-shadow': 0,
      },
    },
  ],
};
