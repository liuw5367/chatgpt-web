module.exports = {
  extends: ["next/core-web-vitals", "@unocss"],
  plugins: ["simple-import-sort"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "react/display-name": ["off", { ignoreTranspilerName: true, checkContextObjects: false }],
    "react/no-unknown-property": ["off", { ignore: ["/^un-/"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": ["warn"],

    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",

    eqeqeq: ["error", "allow-null"],
    "spaced-comment": ["error", "always", { markers: ["/"] }],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
    "lines-between-class-members": ["error", "always"],
    "no-trailing-spaces": "error"
  }
};
