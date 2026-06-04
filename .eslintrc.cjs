/* .eslintrc.cjs */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  ignorePatterns: [
    '.eslintrc.cjs',
    'scripts',
    'node_modules',
    'dist',
    '*.js',
    '*.cjs',
    '*.d.ts',
  ],
  rules: {
  },
};
