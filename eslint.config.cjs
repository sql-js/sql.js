"use strict";

const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: [
            "dist/**",
            "examples/**",
            "documentation/**",
            "node_modules/**",
            "out/**",
            "src/shell-post.js",
            "src/shell-pre.js",
            "test/**"
        ]
    },
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: 5,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2015,
                Atomics: "readonly",
                SharedArrayBuffer: "readonly"
            }
        },
        rules: {
            camelcase: "off",
            "comma-dangle": "off",
            "dot-notation": "off",
            indent: ["error", 4, { SwitchCase: 1 }],
            "max-len": ["error", { code: 80 }],
            "no-bitwise": "off",
            "no-cond-assign": ["error", "except-parens"],
            "no-param-reassign": "off",
            "no-throw-literal": "off",
            "no-useless-assignment": "off",
            "no-var": "off",
            "no-unused-vars": ["error", { caughtErrors: "none" }],
            "object-shorthand": "off",
            "prefer-arrow-callback": "off",
            "prefer-destructuring": "off",
            "prefer-spread": "off",
            "prefer-template": "off",
            quotes: ["error", "double"],
            strict: "off",
            "vars-on-top": "off"
        }
    }
];
