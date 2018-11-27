// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    browser: true,
  },
  globals: {
    GLOBAL_API: true,
    Promise: false,
    process: false,
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  //extends: 'standard',
  extends: ['eslint:recommended', 'plugin:vue/recommended'],
  // required to lint *.vue files
  plugins: ['html'],
  // add your custom rules here
  rules: {
    //'spaced-comment': ["error", "always"],
    // allow paren-less arrow functions
    'arrow-parens': 0,
    //"indent": ["error", 2],
    //'key-spacing': ["error", { "beforeColon": false }],
    //'no-trailing-spaces': 'error',
    //'space-before-blocks': 'error',
    //"space-before-function-paren": ["error", "never"],
    //'space-in-parens': ["error", "never"],
    'no-empty': ['error', {allowEmptyCatch: true}],
    curly: 'error',
    'block-scoped-var': 'error',
    'consistent-return': 'error',
    'no-extra-semi': 0,
    // allow async-await
    //'generator-star-spacing': 0,
    // allow debugger during development
    // 'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // 属性在第一行写一个，比如src，然后其他的换行写，比如alt
    "vue/max-attributes-per-line": [2, {
      "singleline": 1,
      "multiline": {
        "max": 1,
        "allowFirstLine": true
      }
    }],
    // 允许html标签使用双tag闭合
    "vue/html-self-closing": ["error", {
      "html": {
        "void": "never",
        "normal": "any",
        "component": "any"
      },
      "svg": "always",
      "math": "always"
    }],
    "vue/name-property-casing": ["never"],
    // 不考虑vue的钩子书写顺序
    "vue/order-in-components": ["never"]
  },
}
