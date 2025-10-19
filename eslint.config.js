import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      // include browser and node globals so config files and server-side code don't trigger no-undef
      globals: {
        ...globals.browser,
        ...globals.node,
        // explicitly allow process and __dirname in config files
        process: true,
        __dirname: true,
        // Jest globals
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
  // Add common globals used across the project (browser, node, jest)
  // For flat config, use languageOptions.globals instead of 'env'
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      // disable prop-types enforcement for now (project uses mixed typing); reduce noise
      'react/prop-types': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Dodatni rules za production
      'no-console': 'off',
      'no-debugger': 'error',
      'no-unused-vars': 'warn',
    },
  },
]