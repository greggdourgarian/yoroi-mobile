module.exports = {
  extends: ['vacuumlabs'],
  plugins: ['react-native'],
  env: {
    'react-native/react-native': true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.android.js', '.ios.js'],
      },
    },
  },
  rules: {
    'array-callback-return': 2,
    'lines-between-class-members': [1, 'always', {exceptAfterSingleLine: true}],
    'max-len': [
      1,
      {
        code: 80,
        tabWidth: 2,
        ignoreStrings: false,
        ignoreTemplateLiterals: false,
      },
    ],
    'spaced-comment': 1,
    'react/no-access-state-in-setstate': 2,
    'react/no-multi-comp': 0,
    'no-multi-str': 0,
    'react/no-typos': 2,
    'react/sort-comp': 1,
    'no-duplicate-imports': 0,
    'import/no-duplicates': 1,
    'react-native/no-unused-styles': 2,
    'react-native/split-platform-components': 0,
    'react-native/no-inline-styles': 2,
    'no-multiple-empty-lines': ['warn', {max: 2, maxEOF: 0}],
    'react/sort-comp': [
      2,
      {
        order: ['instance-variables', 'lifecycle', 'everything-else', 'render'],
      },
    ],
  },
  globals: {
    Buffer: false,
    Symbol: false,
    Uint8Array: false,
    TextEncoder: false,
    $Call: false,
    $Values: false,
    test: false,
    expect: false,
    describe: false,
    it: false,
    beforeEach: false,
  },
};
