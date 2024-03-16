// @ts-check
import antfu from '@antfu/eslint-config';

export default antfu(
  {
    react: true,
    unocss: true,
    formatters: true,
    markdown: false,
    stylistic: { semi: true },
    ignores: ['/public/*'],
  },
  {
    rules: {
      'curly': ['error', 'all'],
      'style/jsx-indent': ['error', 2],
      'style/arrow-parens': ['error', 'always'],
      'style/brace-style': ['error', 'stroustrup'],

      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off',
      'ts/no-unused-vars': 'off',
      // 自动删除未使用的 import 引用
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      //
      'react/display-name': 'off',
    },
  },
);
