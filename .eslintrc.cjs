module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  env: { browser: true, node: true, es6: true, mocha: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "@unocss",
  ],
  plugins: ["simple-import-sort", "prettier", "react-hooks", 'unused-imports'],
  rules: {
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],

    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/display-name": ["off", { ignoreTranspilerName: true, checkContextObjects: false }],
    "react/no-unknown-property": ["off", { ignore: ["/^un-/"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": ["warn"],

    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",

    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": "warn",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-inferrable-types": "off",

    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
    ],

    "no-unused-vars": ["off", { argsIgnorePattern: "^_" }],
    eqeqeq: ['error', "always", {"null": "ignore"}],
    "spaced-comment": ["error", "always", { markers: ["/"] }],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    "lines-between-class-members": ["error", "always"],
    "no-trailing-spaces": "error",
  },
};
