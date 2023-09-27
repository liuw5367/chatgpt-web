module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: 'detect' } },
  env: { browser: true, node: true, es6: true, mocha: true, jest: true, jasmine: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/recommended',
    'plugin:prettier/recommended', // Make sure this is always the last element in the array.
    '@unocss',
  ],
  plugins: ['simple-import-sort', 'prettier', 'react-hooks', 'unused-imports'],
  rules: {
    eqeqeq: ['error', 'always', { null: 'ignore' }],
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/display-name': ['off', { ignoreTranspilerName: true, checkContextObjects: false }],
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'no-unused-vars': ['off', { argsIgnorePattern: '^_' }],

    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    // ------
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': ['warn', { additionalHooks: 'useRecoilCallback' }],
    // 自动删除未使用的 import 引用
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],
    //
    'unicorn/prevent-abbreviations': 'off',
    'unicorn/no-null': 'off',
    'unicorn/filename-case': ['off', { cases: { kebabCase: true, pascalCase: true, camelCase: true } }],
    'unicorn/prefer-query-selector': 'warn',
    'unicorn/consistent-function-scoping': 'warn',
    'unicorn/no-useless-undefined': ['error', { checkArguments: false }],
    // 'unicorn/consistent-destructuring': 'warn',
    // ------
    'require-yield': 'warn',
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'lines-between-class-members': ['error', 'always'],
    // 禁用行尾空白
    'no-trailing-spaces': 'error',
    // ignore 不支持正则表达式，unocss attributify 无法识别，所以禁用
    'react/no-unknown-property': ['off', { ignore: ['/^un-/'] }],
  },
};
