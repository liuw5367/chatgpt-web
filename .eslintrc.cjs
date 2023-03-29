module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  env: { browser: true, node: true, es6: true, mocha: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended", // Make sure this is always the last element in the array.
  ],
  plugins: ["simple-import-sort", "prettier", "react-hooks"],
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

    "no-unused-vars": ["off", { argsIgnorePattern: "^_" }],
    eqeqeq: ["error", "allow-null"],
    "spaced-comment": ["error", "always", { markers: ["/"] }],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    "lines-between-class-members": ["error", "always"],
    "no-trailing-spaces": "error",
  },
};
