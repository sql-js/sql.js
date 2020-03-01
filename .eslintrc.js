module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 5,
    sourceType: "script",
  },
  rules: {
    "strict": ["error", "function"],
    "no-cond-assign": ["error", "except-parens"],
    "no-var": "off",
    "vars-on-top": "off",
    "prefer-destructuring": "off",
    "prefer-spread": "off",
    "prefer-template": "off",
    "prefer-arrow-callback": "off",
    "comma-dangle": "off",
    "object-shorthand": "off",
    "no-throw-literal": "off",
    "no-param-reassign": "off",
    "no-bitwise": "off",
    "camelcase": "off",
    "dot-notation": "off",
    "indent": ["error", 4],
    "quotes": ["error", "double"],
  },
};
