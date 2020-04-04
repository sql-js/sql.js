module.exports = {
    env: {
        browser: true,
        es6: true,
        node: true
    },
    extends: [
        "airbnb-base"
    ],
    globals: {
        Atomics: "readonly",
        SharedArrayBuffer: "readonly"
    },
    ignorePatterns: [
        "/dist/",
        "/examples/",
        "/node_modules/",
        "/out/",
        "/src/shell-post.js",
        "/src/shell-pre.js",
        "/test/",
        "!/.eslintrc.js"
    ],
    parserOptions: {
        ecmaVersion: 5,
        sourceType: "script"
    },
    rules: {
        camelcase: "off",
        "comma-dangle": "off",
        "dot-notation": "off",
        indent: ["error", 4, { SwitchCase: 1 }],
        "no-bitwise": "off",
        "no-cond-assign": ["error", "except-parens"],
        "no-param-reassign": "off",
        "no-throw-literal": "off",
        "no-var": "off",
        "object-shorthand": "off",
        "prefer-arrow-callback": "off",
        "prefer-destructuring": "off",
        "prefer-spread": "off",
        "prefer-template": "off",
        quotes: ["error", "double"],
        strict: ["error", "function"],
        "vars-on-top": "off"
    }
};
