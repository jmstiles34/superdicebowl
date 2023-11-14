module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: ['plugin:svelte/recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['*.cjs'],
  overrides: [{ files: ['*.svelte'], parser: 'svelte-eslint-parser' }],
  settings: {
    svelte: {
      ignoreWarnings: [
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-member-access'
      ],
      compileOptions: {
        postcss: {
          configFilePath: './path/to/my/postcss.config.js'
        }
      },
      kit: {
        files: {
          routes: 'src/routes'
        }
      }
    }
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  }
};
